import OpenAI from "openai";
import { storage } from "./storage";
import { workflowOrchestrator } from "./workflow-orchestrator";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface KnowledgeVector {
  id: string;
  content: string;
  embeddings: number[];
  metadata: {
    source: string;
    type: 'prospect' | 'research' | 'content' | 'performance' | 'insight';
    userId: number;
    organizationId: number;
    timestamp: Date;
    relevance: number;
  };
}

interface RAGQuery {
  query: string;
  userId: number;
  organizationId: number;
  context?: string;
  filters?: {
    type?: string[];
    timeRange?: { start: Date; end: Date };
    relevanceThreshold?: number;
  };
}

interface RAGResponse {
  answer: string;
  sources: KnowledgeVector[];
  confidence: number;
  suggestedActions: string[];
  relatedInsights: string[];
}

interface OrganizationKnowledgeGraph {
  organizationId: number;
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  insights: DerivedInsight[];
  lastUpdated: Date;
}

interface KnowledgeEntity {
  id: string;
  type: 'account' | 'person' | 'technology' | 'competitor' | 'industry' | 'campaign';
  name: string;
  properties: { [key: string]: any };
  connections: string[];
  importance: number; // 0-100
}

interface KnowledgeRelationship {
  from: string;
  to: string;
  type: 'works_at' | 'competes_with' | 'uses_technology' | 'targets' | 'influences';
  strength: number; // 0-100
  evidence: string[];
  lastUpdated: Date;
}

interface DerivedInsight {
  id: string;
  type: 'pattern' | 'trend' | 'opportunity' | 'risk';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  source: string[];
  generatedAt: Date;
}

class RAGIntelligenceEngine {
  private knowledgeVectors: Map<string, KnowledgeVector[]> = new Map();
  private organizationGraphs: Map<number, OrganizationKnowledgeGraph> = new Map();
  private vectorSearchIndex: Map<string, KnowledgeVector[]> = new Map();

  /**
   * Initialize RAG system for organization
   */
  async initializeOrganizationRAG(organizationId: number, teamMembers: number[]): Promise<void> {
    console.log(`Initializing RAG system for organization ${organizationId}`);
    
    // Create knowledge graph
    const knowledgeGraph: OrganizationKnowledgeGraph = {
      organizationId,
      entities: [],
      relationships: [],
      insights: [],
      lastUpdated: new Date()
    };

    // Ingest all existing data
    for (const userId of teamMembers) {
      await this.ingestUserData(userId, organizationId);
    }

    // Build knowledge graph
    await this.buildKnowledgeGraph(organizationId);
    
    // Generate initial insights
    await this.generateDerivedInsights(organizationId);

    this.organizationGraphs.set(organizationId, knowledgeGraph);
  }

  /**
   * Ingest user data into RAG system
   */
  async ingestUserData(userId: number, organizationId: number): Promise<void> {
    const vectors: KnowledgeVector[] = [];

    // Ingest prospects
    const prospects = await storage.getProspects(userId);
    for (const prospect of prospects) {
      const vector = await this.createVector(
        `${prospect.name} at ${prospect.company} - ${prospect.role}. Email: ${prospect.email}`,
        'prospect',
        userId,
        organizationId,
        { prospectId: prospect.id, company: prospect.company, role: prospect.role }
      );
      vectors.push(vector);
    }

    // Ingest research
    const research = await storage.getAccountResearch(userId);
    for (const item of research) {
      const researchContent = `${item.companyName} research: Industry: ${item.industry}, Size: ${item.companySize}, Systems: ${item.currentSystems}`;
      const vector = await this.createVector(
        researchContent,
        'research',
        userId,
        organizationId,
        { researchId: item.id, company: item.companyName, industry: item.industry }
      );
      vectors.push(vector);
    }

    // Ingest generated content
    const content = await storage.getGeneratedContent(userId);
    for (const item of content) {
      const vector = await this.createVector(
        `${item.type} content: ${item.subject} - ${item.content}`,
        'content',
        userId,
        organizationId,
        { contentId: item.id, type: item.type, tone: item.tone }
      );
      vectors.push(vector);
    }

    // Store vectors
    const orgVectors = this.knowledgeVectors.get(organizationId.toString()) || [];
    orgVectors.push(...vectors);
    this.knowledgeVectors.set(organizationId.toString(), orgVectors);

    // Update search index
    await this.updateSearchIndex(organizationId, vectors);
  }

  /**
   * Query RAG system for intelligent responses
   */
  async queryRAG(query: RAGQuery): Promise<RAGResponse> {
    console.log(`RAG Query: ${query.query}`);
    
    // Generate query embeddings
    const queryEmbeddings = await this.generateEmbeddings(query.query);
    
    // Find relevant vectors
    const relevantVectors = await this.findRelevantVectors(
      queryEmbeddings,
      query.organizationId,
      query.filters
    );

    // Generate context-aware response
    const response = await this.generateContextualResponse(
      query.query,
      relevantVectors,
      query.organizationId
    );

    // Get suggested actions
    const suggestedActions = await this.generateSuggestedActions(
      query.query,
      relevantVectors,
      query.organizationId
    );

    // Get related insights
    const relatedInsights = await this.getRelatedInsights(
      query.query,
      query.organizationId
    );

    return {
      answer: response,
      sources: relevantVectors,
      confidence: this.calculateConfidence(relevantVectors),
      suggestedActions,
      relatedInsights
    };
  }

  /**
   * Build knowledge graph from vectors
   */
  async buildKnowledgeGraph(organizationId: number): Promise<void> {
    const vectors = this.knowledgeVectors.get(organizationId.toString()) || [];
    const graph = this.organizationGraphs.get(organizationId);
    
    if (!graph) return;

    const entities: KnowledgeEntity[] = [];
    const relationships: KnowledgeRelationship[] = [];

    // Extract entities from vectors
    for (const vector of vectors) {
      if (vector.metadata.type === 'prospect') {
        entities.push({
          id: `person-${vector.metadata.userId}-${Date.now()}`,
          type: 'person',
          name: vector.metadata.name || 'Unknown',
          properties: vector.metadata,
          connections: [],
          importance: 50
        });
      } else if (vector.metadata.type === 'research') {
        entities.push({
          id: `account-${vector.metadata.company}`,
          type: 'account',
          name: vector.metadata.company || 'Unknown',
          properties: vector.metadata,
          connections: [],
          importance: 70
        });
      }
    }

    // Build relationships
    for (const entity of entities) {
      if (entity.type === 'person' && entity.properties.company) {
        const companyEntity = entities.find(e => 
          e.type === 'account' && e.name === entity.properties.company
        );
        
        if (companyEntity) {
          relationships.push({
            from: entity.id,
            to: companyEntity.id,
            type: 'works_at',
            strength: 90,
            evidence: ['prospect_data'],
            lastUpdated: new Date()
          });
        }
      }
    }

    graph.entities = entities;
    graph.relationships = relationships;
    graph.lastUpdated = new Date();
  }

  /**
   * Generate derived insights from knowledge graph
   */
  async generateDerivedInsights(organizationId: number): Promise<DerivedInsight[]> {
    const graph = this.organizationGraphs.get(organizationId);
    if (!graph) return [];

    const insights: DerivedInsight[] = [];

    // Pattern: Companies with multiple contacts
    const companyContactCount = new Map<string, number>();
    for (const relationship of graph.relationships) {
      if (relationship.type === 'works_at') {
        const company = graph.entities.find(e => e.id === relationship.to);
        if (company) {
          companyContactCount.set(company.name, (companyContactCount.get(company.name) || 0) + 1);
        }
      }
    }

    const multiContactCompanies = Array.from(companyContactCount.entries())
      .filter(([_, count]) => count > 1);

    if (multiContactCompanies.length > 0) {
      insights.push({
        id: `multi-contact-${Date.now()}`,
        type: 'opportunity',
        title: 'Multi-Contact Account Opportunities',
        description: `${multiContactCompanies.length} companies have multiple contacts. Focus on account-based approaches.`,
        confidence: 85,
        impact: 'high',
        actionable: true,
        source: ['knowledge_graph'],
        generatedAt: new Date()
      });
    }

    // Technology trend analysis
    const technologyMentions = new Map<string, number>();
    const vectors = this.knowledgeVectors.get(organizationId.toString()) || [];
    
    const techKeywords = ['Salesforce', 'SAP', 'Oracle', 'Microsoft', 'QA', 'automation', 'testing'];
    for (const vector of vectors) {
      for (const keyword of techKeywords) {
        if (vector.content.toLowerCase().includes(keyword.toLowerCase())) {
          technologyMentions.set(keyword, (technologyMentions.get(keyword) || 0) + 1);
        }
      }
    }

    const topTechnologies = Array.from(technologyMentions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topTechnologies.length > 0) {
      insights.push({
        id: `tech-trend-${Date.now()}`,
        type: 'trend',
        title: 'Technology Focus Areas',
        description: `Top technologies mentioned: ${topTechnologies.map(([tech, count]) => `${tech} (${count})`).join(', ')}`,
        confidence: 75,
        impact: 'medium',
        actionable: true,
        source: ['content_analysis'],
        generatedAt: new Date()
      });
    }

    graph.insights = insights;
    return insights;
  }

  /**
   * Get contextual recommendations for user
   */
  async getContextualRecommendations(
    userId: number,
    organizationId: number,
    context?: string
  ): Promise<{
    recommendations: string[];
    insights: DerivedInsight[];
    nextBestActions: string[];
  }> {
    const graph = this.organizationGraphs.get(organizationId);
    const vectors = this.knowledgeVectors.get(organizationId.toString()) || [];
    const userVectors = vectors.filter(v => v.metadata.userId === userId);

    const recommendations: string[] = [];
    const nextBestActions: string[] = [];

    // Analyze user's recent activity
    const recentContent = userVectors
      .filter(v => v.metadata.type === 'content')
      .sort((a, b) => b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime())
      .slice(0, 10);

    // Content performance analysis
    if (recentContent.length > 0) {
      const toneDistribution = recentContent.reduce((acc, v) => {
        const tone = v.metadata.tone || 'unknown';
        acc[tone] = (acc[tone] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const dominantTone = Object.entries(toneDistribution)
        .sort((a, b) => b[1] - a[1])[0][0];

      recommendations.push(`You frequently use ${dominantTone} tone. Consider A/B testing with consultative tone for enterprise prospects.`);
    }

    // Account coverage analysis
    const userProspects = userVectors.filter(v => v.metadata.type === 'prospect');
    const prospectCompanies = new Set(userProspects.map(v => v.metadata.company));
    
    if (prospectCompanies.size > 0) {
      recommendations.push(`You're working ${prospectCompanies.size} accounts. Consider focusing on top 5 high-intent accounts for better conversion.`);
      nextBestActions.push('Review account prioritization in dashboard');
    }

    // Cross-team insights
    const teamInsights = graph?.insights.filter(i => i.actionable) || [];
    
    return {
      recommendations,
      insights: teamInsights,
      nextBestActions
    };
  }

  /**
   * Update RAG system with new data
   */
  async updateRAG(
    organizationId: number,
    data: any,
    type: 'prospect' | 'research' | 'content' | 'performance' | 'insight',
    userId: number
  ): Promise<void> {
    const vector = await this.createVector(
      JSON.stringify(data),
      type,
      userId,
      organizationId,
      data
    );

    const orgVectors = this.knowledgeVectors.get(organizationId.toString()) || [];
    orgVectors.push(vector);
    this.knowledgeVectors.set(organizationId.toString(), orgVectors);

    // Update search index
    await this.updateSearchIndex(organizationId, [vector]);

    // Regenerate insights if significant update
    if (type === 'research' || type === 'insight') {
      await this.generateDerivedInsights(organizationId);
    }
  }

  // Private helper methods
  private async createVector(
    content: string,
    type: string,
    userId: number,
    organizationId: number,
    metadata: any
  ): Promise<KnowledgeVector> {
    const embeddings = await this.generateEmbeddings(content);
    
    return {
      id: `${type}-${userId}-${Date.now()}`,
      content,
      embeddings,
      metadata: {
        source: 'eloverit_system',
        type: type as any,
        userId,
        organizationId,
        timestamp: new Date(),
        relevance: 1.0,
        ...metadata
      }
    };
  }

  private async generateEmbeddings(text: string): Promise<number[]> {
    // In production, would use OpenAI embeddings API
    // For now, simulate with random embeddings
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
  }

  private async findRelevantVectors(
    queryEmbeddings: number[],
    organizationId: number,
    filters?: any
  ): Promise<KnowledgeVector[]> {
    const vectors = this.knowledgeVectors.get(organizationId.toString()) || [];
    
    // Calculate similarity scores
    const scoredVectors = vectors.map(vector => ({
      vector,
      score: this.calculateCosineSimilarity(queryEmbeddings, vector.embeddings)
    }));

    // Apply filters
    let filteredVectors = scoredVectors;
    if (filters?.type) {
      filteredVectors = filteredVectors.filter(sv => 
        filters.type.includes(sv.vector.metadata.type)
      );
    }

    // Sort by similarity and return top results
    return filteredVectors
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(sv => sv.vector);
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private async generateContextualResponse(
    query: string,
    relevantVectors: KnowledgeVector[],
    organizationId: number
  ): Promise<string> {
    const context = relevantVectors.map(v => v.content).join('\n\n');
    
    const prompt = `Based on the following context from the organization's sales intelligence system, answer the query:

Context:
${context}

Query: ${query}

Provide a comprehensive, actionable response that leverages the organization's collective intelligence.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an AI sales intelligence assistant. Provide actionable insights based on the organization's data."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content || 'No response generated';
  }

  private async generateSuggestedActions(
    query: string,
    relevantVectors: KnowledgeVector[],
    organizationId: number
  ): Promise<string[]> {
    const actions: string[] = [];
    
    // Analyze query intent and relevant data
    if (query.toLowerCase().includes('prospect')) {
      actions.push('Review prospect prioritization');
      actions.push('Generate personalized outreach sequence');
    }
    
    if (query.toLowerCase().includes('account')) {
      actions.push('Update account research');
      actions.push('Check for new intent signals');
    }
    
    if (query.toLowerCase().includes('performance')) {
      actions.push('Review content performance metrics');
      actions.push('A/B test new approaches');
    }

    return actions;
  }

  private async getRelatedInsights(query: string, organizationId: number): Promise<string[]> {
    const graph = this.organizationGraphs.get(organizationId);
    if (!graph) return [];

    return graph.insights
      .filter(i => i.actionable)
      .map(i => i.title)
      .slice(0, 3);
  }

  private calculateConfidence(vectors: KnowledgeVector[]): number {
    if (vectors.length === 0) return 0;
    
    const avgRelevance = vectors.reduce((sum, v) => sum + v.metadata.relevance, 0) / vectors.length;
    const recency = vectors.reduce((sum, v) => {
      const daysSince = (Date.now() - v.metadata.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return sum + Math.max(0, 1 - daysSince / 30); // Decay over 30 days
    }, 0) / vectors.length;
    
    return Math.round((avgRelevance * 0.7 + recency * 0.3) * 100);
  }

  private async updateSearchIndex(organizationId: number, vectors: KnowledgeVector[]): Promise<void> {
    const indexKey = `search-${organizationId}`;
    const existing = this.vectorSearchIndex.get(indexKey) || [];
    existing.push(...vectors);
    this.vectorSearchIndex.set(indexKey, existing);
  }
}

export const ragIntelligence = new RAGIntelligenceEngine();