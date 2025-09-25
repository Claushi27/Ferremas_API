// controllers/authSupabaseController.js
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login usando Supabase
exports.login = async (req, res) => {
    try {
        console.log('🔍 Iniciando login con Supabase...');
        const { email, password } = req.body;

        console.log('📝 Datos recibidos:', { email, hasPassword: !!password });

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Buscar usuario por email - sin join por ahora
        const { data: usuario, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('email', email)
            .single();

        console.log('📊 Respuesta Supabase usuario:', {
            found: !!usuario,
            error: error?.message
        });

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }
            console.error('Error Supabase login:', error);
            return res.status(500).json({
                error: 'Error interno del servidor durante el login',
                details: error.message
            });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                id: usuario.id_usuario,
                email: usuario.email,
                rol: usuario.rol?.nombre_rol
            },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' }
        );

        // Remover password del response
        const { password_hash, ...usuarioSinPassword } = usuario;

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: usuarioSinPassword,
                token
            }
        });

    } catch (err) {
        console.error('Error servidor login:', err);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: err.message
        });
    }
};

// Registro usando Supabase
exports.register = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono } = req.body;

        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({
                error: 'Nombre, apellido, email y contraseña son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        const { data: usuarioExistente } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('email', email)
            .single();

        if (usuarioExistente) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        // Hash de la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Crear nuevo usuario
        const { data: nuevoUsuario, error } = await supabase
            .from('usuario')
            .insert([
                {
                    nombre,
                    apellido,
                    email,
                    password_hash: passwordHash,
                    telefono,
                    id_rol: 2 // Rol cliente por defecto
                }
            ])
            .select(`
                *,
                rol (
                    id_rol,
                    nombre_rol
                )
            `)
            .single();

        if (error) {
            console.error('Error Supabase register:', error);
            return res.status(500).json({
                error: 'Error al crear usuario',
                details: error.message
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                id: nuevoUsuario.id_usuario,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol?.nombre_rol
            },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' }
        );

        // Remover password del response
        const { password_hash, ...usuarioSinPassword } = nuevoUsuario;

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: usuarioSinPassword,
                token
            }
        });

    } catch (err) {
        console.error('Error servidor register:', err);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: err.message
        });
    }
};