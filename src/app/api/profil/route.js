// src/app/api/profil/route.js

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { z } from "zod"; // Impor Zod

// Skema validasi untuk profil desa
const profilSchema = z.object({
    sejarah: z.string().optional(),
    visi: z.string().optional(),
    misi: z.string().optional(),
});

// GET: Ambil data profil
export async function GET() {
    try {
        const { rows } = await pool.query("SELECT * FROM profil WHERE id = 1");
        if (rows.length === 0) {
            // Jika tidak ada data, kembalikan data default agar halaman tidak error
            return NextResponse.json({
                id: 1,
                sejarah: "",
                visi: "",
                misi: "",
            });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Error GET /api/profil:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data profil" },
            { status: 500 }
        );
    }
}

// POST: Update data profil dengan validasi
export async function POST(req) {
    try {
        const body = await req.json();

        // Validasi input
        const validation = profilSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Data tidak valid",
                    details: validation.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        // Ambil data yang sudah divalidasi, berikan nilai default jika tidak ada
        const { sejarah = "", visi = "", misi = "" } = validation.data;

        // Menggunakan query UPSERT (UPDATE atau INSERT jika tidak ada)
        const query = `
            INSERT INTO profil (id, sejarah, visi, misi)
            VALUES (1, $1, $2, $3)
            ON CONFLICT (id) 
            DO UPDATE SET 
                sejarah = EXCLUDED.sejarah, 
                visi = EXCLUDED.visi, 
                misi = EXCLUDED.misi
            RETURNING *;
        `;
        const values = [sejarah, visi, misi];
        const { rows } = await pool.query(query, values);

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Error POST /api/profil:", error);
        return NextResponse.json(
            { error: "Gagal menyimpan data profil" },
            { status: 500 }
        );
    }
}
