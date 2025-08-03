// src/app/api/berita/route.js

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { z } from "zod"; // Impor Zod

// Skema validasi untuk berita
const beritaSchema = z.object({
    judul: z
        .string()
        .min(5, { message: "Judul harus memiliki minimal 5 karakter" }),
    konten: z
        .string()
        .min(10, { message: "Konten harus memiliki minimal 10 karakter" }),
    gambar: z
        .string()
        .url({ message: "URL gambar tidak valid" })
        .optional()
        .or(z.literal("")),
});

// GET: Ambil semua berita
export async function GET() {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM berita ORDER BY id DESC"
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error GET /api/berita:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data berita" },
            { status: 500 }
        );
    }
}

// POST: Tambah berita baru dengan validasi
export async function POST(req) {
    try {
        const body = await req.json();

        // Validasi input
        const validation = beritaSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Data tidak valid",
                    details: validation.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { judul, konten, gambar } = validation.data;
        const query = `
            INSERT INTO berita (judul, konten, gambar) 
            VALUES ($1, $2, $3) RETURNING *
        `;
        const values = [judul, konten, gambar];
        const { rows } = await pool.query(query, values);
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error("Error POST /api/berita:", error);
        return NextResponse.json(
            { error: "Gagal menambahkan berita" },
            { status: 500 }
        );
    }
}

// PUT: Update berita dengan validasi
export async function PUT(req) {
    try {
        const body = await req.json();

        // Gabungkan skema berita dengan validasi untuk ID
        const updateSchema = beritaSchema.extend({
            id: z.number().int().positive(),
        });

        const validation = updateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Data tidak valid",
                    details: validation.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { id, judul, konten, gambar } = validation.data;
        const query = `
            UPDATE berita 
            SET judul = $1, konten = $2, gambar = $3 
            WHERE id = $4 RETURNING *
        `;
        const values = [judul, konten, gambar, id];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Berita tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Error PUT /api/berita:", error);
        return NextResponse.json(
            { error: "Gagal memperbarui berita" },
            { status: 500 }
        );
    }
}

// DELETE: Hapus berita DAN gambar terkait di Supabase
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID berita diperlukan" },
                { status: 400 }
            );
        }

        const { rows } = await pool.query(
            "SELECT gambar FROM berita WHERE id = $1",
            [id]
        );
        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Berita tidak ditemukan" },
                { status: 404 }
            );
        }

        const imageUrl = rows[0].gambar;
        if (imageUrl) {
            const bucketName = "cms-desa-cikelat";
            const filePath = new URL(imageUrl).pathname.split(
                `/${bucketName}/`
            )[1];

            if (filePath) {
                const { error: deleteError } = await supabase.storage
                    .from(bucketName)
                    .remove([filePath]);
                if (deleteError) {
                    console.error(
                        "Gagal menghapus gambar dari Supabase:",
                        deleteError.message
                    );
                }
            }
        }

        await pool.query("DELETE FROM berita WHERE id = $1", [id]);
        return NextResponse.json({
            message: "Berita dan gambar terkait berhasil dihapus",
        });
    } catch (error) {
        console.error("Error DELETE /api/berita:", error);
        return NextResponse.json(
            { error: "Gagal menghapus berita" },
            { status: 500 }
        );
    }
}
