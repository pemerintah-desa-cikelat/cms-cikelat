// src/app/api/login/route.js

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { z } from "zod"; // Impor Zod

// Skema validasi untuk login
const loginSchema = z.object({
    username: z.string().min(1, { message: "Username tidak boleh kosong" }),
    password: z.string().min(1, { message: "Password tidak boleh kosong" }),
});

export async function POST(req) {
    try {
        const body = await req.json();

        // Validasi input
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Data tidak valid",
                    details: validation.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { username, password } = validation.data;

        // Ambil data admin dari database
        const { rows } = await pool.query(
            "SELECT * FROM admin WHERE username = $1",
            [username]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "Username atau password salah" },
                { status: 401 }
            );
        }

        const admin = rows[0];

        // Membandingkan password (contoh sederhana, idealnya menggunakan bcrypt)
        if (password !== admin.password) {
            return NextResponse.json(
                { message: "Username atau password salah" },
                { status: 401 }
            );
        }

        // Buat token JWT
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" } // Token berlaku selama 1 jam
        );

        // Kirim token sebagai respons
        return NextResponse.json({ token });
    } catch (err) {
        console.error("Login error:", err.message);
        return NextResponse.json(
            { message: "Terjadi kesalahan pada server saat login" },
            { status: 500 }
        );
    }
}
