const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'getfitsullana2019@gmail.com',
        pass: 'izdt ckar rull gumv'
    }
});

const sendResetCode = async (email, code) => {
    try {
        const mailOptions = {
            from: 'getfitsullana2019@gmail.com',
            to: email,
            subject: 'Código de recuperación de contraseña - GymPro',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #2563EB;">GymPro</h1>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Recuperación de Contraseña</h2>
                        <p style="color: #4b5563;">Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar el proceso:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="background-color: #eff6ff; color: #2563EB; font-size: 32px; font-weight: bold; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">${code}</span>
                        </div>
                        <p style="color: #4b5563;">Este código expirará en 15 minutos.</p>
                        <p style="color: #4b5563;">Si no has solicitado este cambio, puedes ignorar este correo.</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} GymPro. Todos los derechos reservados.
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = {
    sendResetCode
};
