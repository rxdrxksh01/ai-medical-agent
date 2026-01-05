import { db } from "@/config/db";
import { eq } from "drizzle-orm";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!email) {
        return NextResponse.json({ error: "User or email not found" }, { status: 400 });
    }

    try {
        const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
        
        if (users?.length === 0) {
            const result = await db.insert(usersTable).values({
                name: user?.fullName ?? "No Name",
                email: email,
                credits: 10
            }).returning();

            return NextResponse.json(result[0]);
        }
        
        return NextResponse.json(users[0]);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
