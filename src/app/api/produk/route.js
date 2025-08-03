// src/app/api/produk/route.js

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { z } from "zod"; // Impor Zod

// Definisikan skema validasi untuk produk
const productSchema = z.object({
    nama: z
        .string()
        .min(3, { message: "Nama produk harus memiliki minimal 3 karakter" }),
    harga: z.number().int().positive({ message: "Harga harus angka positif" }),
    kontak: z.string().optional(),
    deskripsi: z.string().optional(),
    gambar: z
        .string()
        .url({ message: "URL gambar tidak valid" })
        .optional()
        .or(z.literal("")),
});

// GET: Ambil semua produk
export async function GET() {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM produk ORDER BY id DESC"
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error GET /api/produk:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data produk" },
            { status: 500 }
        );
    }
}

// POST: Tambah produk baru dengan validasi
export async function POST(req) {
    try {
        const body = await req.json();

        // Validasi input menggunakan Zod
        const validation = productSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Data tidak valid",
                    details: validation.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { nama, harga, gambar, kontak, deskripsi } = validation.data;

        const query = `
      INSERT INTO produk (nama, harga, gambar, kontak, deskripsi)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
        const values = [nama, harga, gambar, kontak, deskripsi];
        const { rows } = await pool.query(query, values);
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error("Error POST /api/produk:", error);
        return NextResponse.json(
            { error: "Gagal menambahkan produk" },
            { status: 500 }
        );
    }
}

// PUT: Update produk dengan validasi
export async function PUT(req) {
    try {
        const body = await req.json();

        // Untuk PUT, kita butuh ID. Kita tambahkan ke skema yang sudah ada.
        const updateSchema = productSchema.extend({
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

        const { id, nama, harga, gambar, kontak, deskripsi } = validation.data;

        const query = `
      UPDATE produk
      SET nama = $1, harga = $2, gambar = $3, kontak = $4, deskripsi = $5
      WHERE id = $6 RETURNING *
    `;
        const values = [nama, harga, gambar, kontak, deskripsi, id];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Produk tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Error PUT /api/produk:", error);
        return NextResponse.json(
            { error: "Gagal memperbarui produk" },
            { status: 500 }
        );
    }
}

// DELETE: Hapus produk DAN gambar terkait di Supabase
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID produk diperlukan di URL" },
                { status: 400 }
            );
        }

        const { rows } = await pool.query(
            "SELECT gambar FROM produk WHERE id = $1",
            [id]
        );
        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Produk tidak ditemukan" },
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

        await pool.query("DELETE FROM produk WHERE id = $1", [id]);
        return NextResponse.json({
            message: "Produk dan gambar terkait berhasil dihapus",
        });
    } catch (error) {
        console.error("Error DELETE /api/produk:", error);
        return NextResponse.json(
            { error: "Gagal menghapus produk" },
            { status: 500 }
        );
    }
}
