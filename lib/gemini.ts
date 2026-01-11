import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIDoctorAgents } from "@/shared/list";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface DoctorMatch {
  id: number;
  specialist: string;
  description: string;
  image: string;
  matchScore: number;
  reasoning: string;
}

// Keyword-based fallback matching
function keywordBasedMatching(symptoms: string): DoctorMatch[] {
  const symptomsLower = symptoms.toLowerCase();
  
  const keywordMap: { [key: string]: { ids: number[], keywords: string[] } } = {
    "Cardiologist": { 
      ids: [4], 
      keywords: ["heart", "chest pain", "blood pressure", "bp", "cardiac", "palpitation", "cholesterol"]
    },
    "Dermatologist": { 
      ids: [3], 
      keywords: ["skin", "rash", "acne", "itch", "hair fall", "scalp", "pimple", "eczema", "tinea", "ringworm", "fungal", "fungus"]
    },
    "Pediatrician": { 
      ids: [2], 
      keywords: ["child", "baby", "infant", "kid", "toddler", "pediatric"]
    },
    "Neurologist": { 
      ids: [7], 
      keywords: ["headache", "migraine", "dizzy", "dizziness", "nerve", "seizure", "brain", "vertigo"]
    },
    "ENT Specialist": { 
      ids: [8], 
      keywords: ["ear", "nose", "throat", "sinus", "hearing", "tinnitus", "sore throat", "cold", "cough"]
    },
    "Orthopedic Specialist": { 
      ids: [5], 
      keywords: ["bone", "joint", "muscle", "back pain", "knee", "shoulder", "fracture", "sprain", "arthritis"]
    },
    "Gynecologist": { 
      ids: [6], 
      keywords: ["period", "menstrual", "pregnancy", "pcos", "ovarian", "uterus", "vaginal", "uti", "urinary tract"]
    },
    "Mental Health Specialist": { 
      ids: [9], 
      keywords: ["stress", "anxiety", "depression", "sleep", "insomnia", "mental", "panic", "mood"]
    },
    "Nutritionist": { 
      ids: [10], 
      keywords: ["diet", "weight", "nutrition", "obesity", "diabetes", "sugar", "food", "eating"]
    }
  };

  const matches: DoctorMatch[] = [];

  for (const [specialist, data] of Object.entries(keywordMap)) {
    let score = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of data.keywords) {
      // Use regex with word boundaries to avoid partial matches (e.g. "near" matching "ear")
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(symptomsLower)) {
        score += 30; // Increased score per keyword
        matchedKeywords.push(keyword);
      }
    }

    if (score > 0) {
      const doctor = AIDoctorAgents.find(d => data.ids.includes(d.id));
      if (doctor) {
        matches.push({
          id: doctor.id,
          specialist: doctor.specialist,
          description: doctor.description,
          image: doctor.image,
          matchScore: Math.min(score + 50, 95), // Base score of 50 + keyword matches, capped at 95
          reasoning: `Matched based on symptoms: ${matchedKeywords.join(", ")}`
        });
      }
    }
  }

  // Sort by score and return top 3
  matches.sort((a, b) => b.matchScore - a.matchScore);
  
  // If no matches, return General Physician
  if (matches.length === 0) {
    return [{
      id: 1,
      specialist: "General Physician",
      description: AIDoctorAgents[0].description,
      image: AIDoctorAgents[0].image,
      matchScore: 70,
      reasoning: "Recommended for general health concerns"
    }];
  }

  return matches.slice(0, 3);
}

export async function analyzeSymptomsAndMatchDoctors(
  symptoms: string
): Promise<DoctorMatch[]> {
  // Check if API key exists
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    console.warn("Gemini API key not configured, using keyword-based matching");
    return keywordBasedMatching(symptoms);
  }

  try {
    // Using gemini-2.0-flash as confirmed by dynamic model check
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Construct prompt (same as before)
    const doctorsList = AIDoctorAgents.map((doc) => ({
      id: doc.id,
      specialist: doc.specialist,
      description: doc.description,
    }));

    const prompt = `You are a medical triage assistant. Analyze the following patient symptoms and match them with the most appropriate specialist doctors.

Patient Symptoms: "${symptoms}"

Available Specialists:
${JSON.stringify(doctorsList, null, 2)}

Instructions:
1. Analyze the symptoms carefully
2. Match the symptoms to the top 3-5 most relevant specialists
3. Provide a match score (0-100) for each specialist
4. Provide a brief reasoning for each match

Return ONLY a valid JSON array in this exact format:
[
  {
    "id": 1,
    "matchScore": 95,
    "reasoning": "Brief explanation of why this specialist is recommended"
  }
]

Return ONLY the JSON array, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const matches = JSON.parse(jsonMatch[0]);

    // Enrich matches with full doctor data
    const enrichedMatches: DoctorMatch[] = matches
      .map((match: any) => {
        const doctor = AIDoctorAgents.find((d) => d.id === match.id);
        if (!doctor) return null;

        return {
          id: doctor.id,
          specialist: doctor.specialist,
          description: doctor.description,
          image: doctor.image,
          matchScore: match.matchScore,
          reasoning: match.reasoning,
        };
      })
      .filter(Boolean)
      .sort((a: DoctorMatch, b: DoctorMatch) => b.matchScore - a.matchScore)
      .slice(0, 5); // Top 5 matches

    return enrichedMatches;
  } catch (error) {
    // Silently fall back to keyword matching without logging the full error to avoid console noise
    // console.warn("AI matching failed, using keywords:", error);
    return keywordBasedMatching(symptoms);
  }
}

export async function generateConsultationSummary(transcript: any[]): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        return "Summary unavailable (API Key missing).";
    }

    const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite-preview-02-05", 
        "gemini-2.0-flash-exp"
    ];

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const transcriptText = Array.isArray(transcript) 
                ? transcript.map(msg => `${msg.role}: ${msg.content}`).join('\n')
                : JSON.stringify(transcript);
            
            const prompt = `You are an expert medical scribe. Summarize the following consultation transcript into a concise medical report.
            
            Transcript:
            ${transcriptText}
            
            Structure the summary as follows:
            1. **Chief Complaint**: Main reason for visit.
            2. **Patient History**: Key details provided by the patient.
            3. **Assessment**: Likely condition or doctor's observation.
            4. **Recommended Plan**: Advice given by the AI doctor.
            
            Keep it professional and concise.`;

            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error: any) {
            console.warn(`Model ${modelName} failed:`, error.message);
            // Continue to next model in list
            if (modelName === modelsToTry[modelsToTry.length - 1]) {
                 return "Summary unavailable. Please try again later.";
            }
            // Small delay before trying next model
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    return "Summary generation failed.";
}
