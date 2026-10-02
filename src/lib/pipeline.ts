import { UserProfile, Opportunity, EligibilityResult, SecurityCheckResult, AutoFillResult, FieldMapping } from "../types";

// Stage 3 - Eligibility Check
export function checkEligibility(profile: UserProfile, opportunity: Opportunity): EligibilityResult {
  const reasons: string[] = [];
  let isEligible = true;

  if (profile.education.length > 0) {
    const highestCgpa = Math.max(...profile.education.map(e => e.cgpa));
    if (highestCgpa >= opportunity.requirements.min_cgpa) {
      reasons.push(`User highest CGPA (${highestCgpa}) meets the minimum requirement (${opportunity.requirements.min_cgpa}).`);
    } else {
      reasons.push(`User highest CGPA (${highestCgpa}) is below the minimum requirement (${opportunity.requirements.min_cgpa}).`);
      isEligible = false;
    }
  } else {
    reasons.push("User profile is missing education details to verify CGPA.");
    return { opportunity_id: opportunity.opportunity_id, verdict: "uncertain", reasons };
  }

  const missingSkills: string[] = [];
  const matchedSkills: string[] = [];
  
  opportunity.requirements.required_skills.forEach(skill => {
    const hasSkill = profile.skills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase());
    if (hasSkill) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  if (missingSkills.length > 0) {
    reasons.push(`User is missing required skill(s): ${missingSkills.join(", ")}.`);
    isEligible = false;
  } else if (matchedSkills.length > 0) {
    reasons.push(`User possesses required skill(s): ${matchedSkills.join(", ")}.`);
  }

  return {
    opportunity_id: opportunity.opportunity_id,
    verdict: isEligible ? "eligible" : "not_eligible",
    reasons
  };
}


// Stage 5 - Auto-Fill Mapping (Mock implementation)
export function generateFieldMappings(profile: UserProfile, opportunity: Opportunity): AutoFillResult {
  let mappings: FieldMapping[] = [];

  if (opportunity.questions && opportunity.questions.length > 0) {
    mappings = opportunity.questions.map(q => {
      let value = "";
      let source: "profile" | "unmapped" | "ai_generated" = "unmapped";
      let confidence = 0;
      
      const lowerQ = q.toLowerCase();
      if (lowerQ.includes('first name')) {
        value = profile.first_name || "";
        source = profile.first_name ? "profile" : "unmapped";
        confidence = profile.first_name ? 1.0 : 0.0;
      } else if (lowerQ.includes('last name')) {
        value = profile.last_name || "";
        source = profile.last_name ? "profile" : "unmapped";
        confidence = profile.last_name ? 1.0 : 0.0;
      } else if (lowerQ.includes('name')) {
        value = `${profile.first_name} ${profile.last_name}`.trim();
        source = value ? "profile" : "unmapped";
        confidence = value ? 1.0 : 0.0;
      } else if (lowerQ.includes('email')) {
        value = profile.email || "";
        source = profile.email ? "profile" : "unmapped";
        confidence = profile.email ? 1.0 : 0.0;
      } else if (lowerQ.includes('university') || lowerQ.includes('institution') || lowerQ.includes('college')) {
        value = profile.education[0]?.institution || "";
        source = value ? "profile" : "unmapped";
        confidence = value ? 1.0 : 0.0;
      } else if (lowerQ.includes('cgpa') || lowerQ.includes('gpa')) {
        value = profile.education[0]?.cgpa?.toString() || "";
        source = value ? "profile" : "unmapped";
        confidence = value ? 1.0 : 0.0;
      } else if (lowerQ.includes('resume') || lowerQ.includes('cv') || lowerQ.includes('document') || lowerQ.includes('link')) {
        value = profile.documents.resume_url || "";
        source = value ? "profile" : "unmapped";
        confidence = value ? 1.0 : 0.0;
      } else if (lowerQ.includes('essay') || lowerQ.includes('why') || lowerQ.includes('cover letter')) {
        value = `I am highly interested in the ${opportunity.title} role at ${opportunity.org}. My background in ${profile.skills.join(", ")} makes me a strong fit.`;
        source = "ai_generated";
        confidence = 0.85;
      }
      
      return { field_name: q, value, source, confidence };
    });
  } else {
    mappings = [
      { field_name: "first_name", value: profile.first_name || "", source: profile.first_name ? "profile" : "unmapped", confidence: profile.first_name ? 1.0 : 0.0 },
      { field_name: "last_name", value: profile.last_name || "", source: profile.last_name ? "profile" : "unmapped", confidence: profile.last_name ? 1.0 : 0.0 },
      { field_name: "email", value: profile.email || "", source: profile.email ? "profile" : "unmapped", confidence: profile.email ? 1.0 : 0.0 },
      { field_name: "university", value: profile.education[0]?.institution || "", source: "profile", confidence: 1.0 },
      { field_name: "cgpa", value: profile.education[0]?.cgpa?.toString() || "", source: "profile", confidence: 1.0 },
      { field_name: "resume_upload", value: profile.documents.resume_url, source: "profile", confidence: 1.0 }
    ];

    if (opportunity.type === "internship") {
      mappings.push({
        field_name: "short_essay",
        value: `I am highly interested in the ${opportunity.title} role at ${opportunity.org}. My background in ${profile.skills.join(", ")} makes me a strong fit.`,
        source: "ai_generated",
        confidence: 0.85
      });
    }
  }

  return {
    opportunity_id: opportunity.opportunity_id,
    field_mappings: mappings
  };
}
