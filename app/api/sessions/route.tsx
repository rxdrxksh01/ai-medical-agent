import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionsTable, usersTable } from "@/config/schema";
import { analyzeSymptomsAndMatchDoctors, generateConsultationSummary } from "@/lib/gemini";
import { eq, desc } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

// POST /api/sessions - Create new session with symptom analysis
export async function POST(request: NextRequest) {
    try {
        const { symptoms } = await request.json();
        const user = await currentUser();
        const email = user?.primaryEmailAddress?.emailAddress;

        if (!symptoms || symptoms.trim().length === 0) {
            return NextResponse.json(
                { error: "Symptoms are required" },
                { status: 400 }
            );
        }

        // Resolve User ID from DB if logged in
        let dbUserId = null;
        if (email) {
            const [dbUser] = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.email, email));

            if (dbUser) {
                dbUserId = dbUser.id;
            }
        }

        // Analyze symptoms and get matched doctors
        const matchedDoctors = await analyzeSymptomsAndMatchDoctors(symptoms);

        // Create session in database
        const [session] = await db
            .insert(sessionsTable)
            .values({
                userId: dbUserId, // Use resolved DB ID
                symptoms: symptoms.trim(),
                matchedDoctors: matchedDoctors,
                status: "pending",
            })
            .returning();

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            matchedDoctors,
        });
    } catch (error: any) {
        console.error("Error creating session:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create session" },
            { status: 500 }
        );
    }
}

// GET /api/sessions?id=123 OR /api/sessions?email=abc@xyz.com&limit=1
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const sessionId = searchParams.get("id");
        const email = searchParams.get("email");
        const limitParam = searchParams.get("limit");

        // Case 1: Fetch by Session ID
        if (sessionId) {
            const [session] = await db
                .select()
                .from(sessionsTable)
                .where(eq(sessionsTable.id, parseInt(sessionId)));

            if (!session) {
                return NextResponse.json(
                    { error: "Session not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                session,
            });
        }

        // Case 2: Fetch by User Email (History)
        if (email) {
            // First get the user ID from email
            const [user] = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.email, email));

            if (!user) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }

            // Then fetch sessions for this user
            let query = db
                .select()
                .from(sessionsTable)
                .where(eq(sessionsTable.userId, user.id))
                .orderBy(desc(sessionsTable.createdAt));

            // Apply limit if provided
            if (limitParam) {
                // @ts-ignore
                query = query.limit(parseInt(limitParam));
            }

            const sessions = await query;

            return NextResponse.json({
                success: true,
                sessions,
            });
        }

        return NextResponse.json(
            { error: "Session ID or Email is required" },
            { status: 400 }
        );

    } catch (error: any) {
        console.error("Error fetching session:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch session" },
            { status: 500 }
        );
    }
}

// PATCH /api/sessions - Update session (Select Doctor OR End Session)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId, selectedDoctorId, status, transcript } = body;

        if (!sessionId) {
            return NextResponse.json(
                { error: "Session ID is required" },
                { status: 400 }
            );
        }

        const updateData: any = {};

        // Scenario 1: Doctor Selection (Start)
        if (selectedDoctorId) {
            updateData.selectedDoctorId = selectedDoctorId;
            updateData.status = "active";
        }

        // Scenario 2: End Session (Save Transcript & Summary)
        if (status === 'completed' && transcript) {
            updateData.status = 'completed';
            updateData.transcript = transcript;

            // Generate AI Summary
            const summary = await generateConsultationSummary(transcript);
            updateData.summary = summary;
        }

        const [updatedSession] = await db
            .update(sessionsTable)
            .set(updateData)
            .where(eq(sessionsTable.id, sessionId))
            .returning();

        if (!updatedSession) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            session: updatedSession,
        });
    } catch (error: any) {
        console.error("Error updating session:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update session" },
            { status: 500 }
        );
    }
}
