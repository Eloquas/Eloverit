"""
TrustBuild™ and StoryBuild™ Enhancement Layers for Eloquas AI
Implements optional trust-based anchoring and narrative-driven email sequences
"""

import json
import random
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from linkedin_auth import linkedin_auth

class TrustStoryBuilder:
    """Manages TrustBuild and StoryBuild email generation modes"""
    
    def __init__(self):
        self.trust_anchors = {
            'company': ['worked at', 'formerly at', 'alumni of'],
            'school': ['graduated from', 'studied at', 'attended'],
            'interests': ['passionate about', 'interested in', 'advocate for']
        }
        
        self.story_steps = [
            ("Hero Introduction", "Introduce the prospect as the hero facing challenges"),
            ("Hero Challenge", "Define the specific challenge they're dealing with"),
            ("Guide Appears", "Introduce Avo/Eloquas as the experienced guide"),
            ("Fork in the Road", "Present the choice: transform or maintain status quo"),
            ("Happy Path Example", "Share social proof of others who succeeded"),
            ("Hero's Victory", "Paint the picture of their success state"),
            ("Guide's Perspective", "Optional wisdom from the guide's experience")
        ]
        
        self.executive_outcomes = [
            "system stability",
            "faster releases", 
            "lower OpEx",
            "seamless updates",
            "reduced technical debt",
            "accelerated time-to-market",
            "improved team velocity",
            "enhanced quality metrics"
        ]
    
    def find_trust_anchors(self, rep_profile: Dict, prospect_profile: Dict) -> Dict[str, List[str]]:
        """Find shared trust anchors between rep and prospect profiles"""
        anchors = {
            'company': [],
            'school': [],
            'interests': []
        }
        
        # Extract from LinkedIn profiles if available
        if rep_profile and prospect_profile:
            # Company overlap
            rep_companies = self._extract_companies(rep_profile)
            prospect_companies = self._extract_companies(prospect_profile)
            anchors['company'] = list(set(rep_companies) & set(prospect_companies))
            
            # School overlap
            rep_schools = self._extract_schools(rep_profile)
            prospect_schools = self._extract_schools(prospect_profile)
            anchors['school'] = list(set(rep_schools) & set(prospect_schools))
            
            # Interest overlap (from headlines/summaries)
            rep_interests = self._extract_interests(rep_profile)
            prospect_interests = self._extract_interests(prospect_profile)
            anchors['interests'] = list(set(rep_interests) & set(prospect_interests))
        
        return anchors
    
    def _extract_companies(self, profile: Dict) -> List[str]:
        """Extract company names from profile"""
        companies = []
        
        # Current company from headline
        headline = profile.get('headline', '')
        if ' at ' in headline:
            company = headline.split(' at ')[-1].strip()
            companies.append(company)
        
        # Note: Full work history requires additional LinkedIn API calls
        # For now, we'll parse from headline/summary if available
        
        return companies
    
    def _extract_schools(self, profile: Dict) -> List[str]:
        """Extract school names from profile"""
        schools = []
        
        # Note: Education data requires additional LinkedIn API calls
        # For now, we'll check headline for common patterns
        headline = profile.get('headline', '').lower()
        
        # Common university abbreviations
        if 'mit' in headline:
            schools.append('MIT')
        if 'stanford' in headline:
            schools.append('Stanford')
        if 'harvard' in headline:
            schools.append('Harvard')
            
        return schools
    
    def _extract_interests(self, profile: Dict) -> List[str]:
        """Extract interests from profile"""
        interests = []
        headline = profile.get('headline', '').lower()
        
        # Check for technology interests
        tech_keywords = ['sap', 'oracle', 'dynamics', 'salesforce', 'qa automation', 
                        'enterprise systems', 'digital transformation', 'devops']
        
        for keyword in tech_keywords:
            if keyword in headline:
                interests.append(keyword)
                
        return interests
    
    def generate_trustbuild_opening(self, anchors: Dict[str, List[str]], 
                                  prospect: Dict, signal: Optional[Dict] = None) -> str:
        """Generate TrustBuild opening based on shared anchors"""
        
        # Priority: Company > School > Interests
        if anchors['company']:
            company = anchors['company'][0]
            return f"I noticed we both have {company} in our backgrounds - the emphasis on operational excellence there really shaped my approach to enterprise systems."
        
        elif anchors['school']:
            school = anchors['school'][0]
            return f"Fellow {school} alum here - I've found that analytical rigor we learned there invaluable in evaluating enterprise QA solutions."
        
        elif anchors['interests']:
            interest = anchors['interests'][0]
            return f"I see we share a focus on {interest} - it's been fascinating to see how it's evolving in enterprise environments."
        
        else:
            # Soft intro fallback
            return self._generate_soft_intro(prospect, signal)
    
    def _generate_soft_intro(self, prospect: Dict, signal: Optional[Dict] = None) -> str:
        """Generate soft intro when no anchors found"""
        company = prospect.get('company', 'your company')
        
        intros = [
            f"I've been following {company}'s impressive growth in the enterprise space.",
            f"Your team at {company} has been setting the standard for operational excellence.",
            f"The innovation coming out of {company} caught my attention, particularly around system modernization."
        ]
        
        return random.choice(intros)
    
    def generate_trustbuild_email(self, prospect: Dict, anchors: Dict[str, List[str]], 
                                signal: Optional[Dict] = None, step: int = 1) -> Dict[str, str]:
        """Generate a single TrustBuild email"""
        
        opening = self.generate_trustbuild_opening(anchors, prospect, signal)
        
        # Build consultative body focused on giving value
        company = prospect.get('company', 'your company')
        name = prospect.get('name', '').split()[0] if prospect.get('name') else 'there'
        
        # Give-first elements
        insights = [
            f"I noticed {company} is scaling its QA operations - here's a framework we've seen work well for similar enterprises: focus on test stability before coverage expansion.",
            f"Based on {company}'s recent initiatives, you might find this QA maturity assessment useful - it's helped similar teams identify quick wins.",
            f"I've compiled some benchmarks from enterprises in your space regarding testing efficiency - happy to share what's working for them."
        ]
        
        body = f"""Hi {name},

{opening}

{random.choice(insights)}

No agenda here - just sharing what's been valuable for others navigating similar challenges.

Best regards,
[Your name]"""

        subject_lines = [
            f"Quick thought on {company}'s QA scaling",
            f"Framework that might help {company}",
            f"Benchmarks for {company}'s consideration"
        ]
        
        return {
            'subject': random.choice(subject_lines),
            'body': body,
            'trustbuild_enabled': True,
            'trust_anchor_used': bool(anchors['company'] or anchors['school'] or anchors['interests'])
        }
    
    def generate_storybuild_sequence(self, prospect: Dict, signal: Optional[Dict] = None,
                                   include_optional_step: bool = True) -> List[Dict[str, str]]:
        """Generate full StoryBuild Hero's Journey sequence"""
        
        company = prospect.get('company', 'your company')
        name = prospect.get('name', '').split()[0] if prospect.get('name') else 'there'
        role = prospect.get('title', 'QA leader')
        
        sequence = []
        num_steps = 7 if include_optional_step else 6
        
        for i, (step_name, step_desc) in enumerate(self.story_steps[:num_steps]):
            email = self._generate_story_email(i + 1, step_name, prospect, signal)
            email['storybuild_enabled'] = True
            email['story_step'] = i + 1
            email['story_step_name'] = step_name
            email['total_steps'] = num_steps
            sequence.append(email)
        
        return sequence
    
    def _generate_story_email(self, step: int, step_name: str, 
                            prospect: Dict, signal: Optional[Dict] = None) -> Dict[str, str]:
        """Generate individual story email based on Hero's Journey step"""
        
        company = prospect.get('company', 'your company')
        name = prospect.get('name', '').split()[0] if prospect.get('name') else 'there'
        role = prospect.get('title', 'QA leader')
        
        # Each email 100-125 words max
        emails = {
            1: {  # Hero Introduction
                'subject': f"{name}, your QA transformation journey",
                'body': f"""Hi {name},

Every enterprise {role} faces the moment when manual testing can't keep pace with deployment demands. You've built something remarkable at {company}, but the next phase requires a different approach.

Your team's dedication is clear. The question isn't about working harder - it's about working differently. The enterprises that thrive are those that recognize when it's time to evolve their testing philosophy.

What's your vision for QA at {company} over the next 18 months?

Best regards,
[Your name]"""
            },
            2: {  # Hero Challenge
                'subject': f"The challenge facing {company}'s QA",
                'body': f"""Hi {name},

The challenge is real: regression cycles stretching to weeks, critical bugs slipping through, developers waiting on test environments. Sound familiar?

You're not alone. Every scaling enterprise hits this inflection point where traditional QA becomes the bottleneck. {company}'s growth makes this even more acute - success creates complexity.

The pressure from stakeholders for faster releases while maintaining quality feels impossible with current approaches. But what if the problem isn't your team's capability, but the tools they're using?

Curious about your thoughts on this.

Best regards,
[Your name]"""
            },
            3: {  # Guide Appears
                'subject': "A different path for QA excellence",
                'body': f"""Hi {name},

We've guided 200+ enterprises through this exact QA transformation. Not as vendors pushing tools, but as partners who've lived through these challenges.

Avo's approach isn't about replacing your team - it's about amplifying their expertise. Imagine your best QA engineer's knowledge, codified and scaled across every test. That's what intelligent automation delivers.

The enterprises seeing 80% reduction in test time share one trait: they stopped thinking of automation as scripting and started thinking of it as intelligence augmentation.

Worth exploring how this applies to {company}?

Best regards,
[Your name]"""
            },
            4: {  # Fork in the Road
                'subject': f"{company} at the QA crossroads",
                'body': f"""Hi {name},

Two paths diverge for {company}'s QA future:

Path 1: Continue expanding manual testing, hire more QAs, accept longer release cycles. It works, but at what cost to innovation speed?

Path 2: Embrace intelligent automation that learns from your team, scales their expertise, and frees them for strategic quality initiatives.

The choice defines whether QA accelerates or constrains {company}'s growth. enterprises taking Path 2 report 60% faster releases and 40% fewer production issues.

Which direction aligns with your vision?

Best regards,
[Your name]"""
            },
            5: {  # Happy Path Example
                'subject': f"What happened when [Similar Company] transformed QA",
                'body': f"""Hi {name},

[Similar Company] faced your exact situation 18 months ago. Same scale, same complexity, same QA bottlenecks.

Today: 3-day regression cycles (down from 3 weeks), 95% test coverage (up from 60%), zero critical bugs in production for 6 months. Their QA team? Refocused on architecture and exploratory testing - the high-value work that matters.

The transformation took 90 days. Not years. The key was starting with one critical workflow and proving the model before scaling.

Could {company} see similar results?

Best regards,
[Your name]"""
            },
            6: {  # Hero's Victory
                'subject': f"Imagining {company}'s QA future",
                'body': f"""Hi {name},

Picture this: {company} shipping features daily with confidence. Your QA team designing quality into the architecture, not just catching bugs. Developers getting instant feedback. Customers delighting in stability.

This isn't fantasy - it's the reality for enterprises that made the intelligent automation leap. Your expertise, amplified by AI, creates a quality engine that scales with growth.

The journey from QA bottleneck to QA accelerator is proven and repeatable. The only question is timing.

Ready to explore what this transformation could look like for {company}?

Best regards,
[Your name]"""
            },
            7: {  # Guide's Perspective (Optional)
                'subject': "A final thought on QA evolution",
                'body': f"""Hi {name},

After guiding 200+ QA transformations, one truth emerges: the best time to evolve is before you must. {company} has the momentum and vision to transform from a position of strength.

Your team's deep expertise + intelligent automation = competitive advantage that compounds over time. The enterprises thriving in 2025 made this shift in 2024.

I believe {company} can set the standard for what modern QA excellence looks like. The question is: are you ready to lead that transformation?

Let's discuss your vision.

Best regards,
[Your name]"""
            }
        }
        
        return emails.get(step, emails[1])
    
    def generate_combined_sequence(self, prospect: Dict, rep_profile: Dict, 
                                 prospect_profile: Dict, signal: Optional[Dict] = None,
                                 include_optional_step: bool = True) -> List[Dict[str, str]]:
        """Generate combined TrustBuild + StoryBuild sequence"""
        
        # Find trust anchors
        anchors = self.find_trust_anchors(rep_profile, prospect_profile)
        
        # Generate story sequence
        sequence = self.generate_storybuild_sequence(prospect, signal, include_optional_step)
        
        # Enhance each email with trust anchoring where appropriate
        for i, email in enumerate(sequence):
            if i == 0:  # First email gets primary trust anchor
                opening = self.generate_trustbuild_opening(anchors, prospect, signal)
                # Prepend trust anchor to body
                email['body'] = email['body'].replace(
                    f"Hi {prospect.get('name', '').split()[0] if prospect.get('name') else 'there'},",
                    f"Hi {prospect.get('name', '').split()[0] if prospect.get('name') else 'there'},\n\n{opening}"
                )
            
            # Add executive outcome language throughout
            outcome = random.choice(self.executive_outcomes)
            if outcome not in email['body']:
                email['body'] = email['body'].replace(
                    "Best regards,",
                    f"The path to {outcome} is clear.\n\nBest regards,"
                )
            
            # Mark as combined mode
            email['trustbuild_enabled'] = True
            email['trust_anchor_used'] = bool(anchors['company'] or anchors['school'] or anchors['interests'])
            
        return sequence
    
    def regenerate_step(self, step_number: int, prospect: Dict, 
                       signal: Optional[Dict] = None) -> Dict[str, str]:
        """Regenerate a specific story step"""
        if 1 <= step_number <= 7:
            step_name = self.story_steps[step_number - 1][0]
            return self._generate_story_email(step_number, step_name, prospect, signal)
        else:
            raise ValueError(f"Invalid step number: {step_number}. Must be between 1 and 7.")

# Global instance
trust_story_builder = TrustStoryBuilder()