import { useState } from 'react';
import { toast } from 'react-toastify';
import {
    Card,
    Input,
    Checkbox,
    Button,
    Typography,
} from "@material-tailwind/react";
import 'cookie-store';

export function LoginCard() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Disable button to prevent multiple submissions
        event.target.querySelector('button').disabled = true;

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        try {
            const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/auth/login`, {
                method: "POST",
                body: formData,
            });
            const { status, data, message } = await response.json();

            if (!status) {
                toast.error(message ?? "Error al iniciar sesión", {
                    position: "bottom-right",
                });
            } else {
                await Promise.all([
                    cookieStore.set("token", data.token),
                    cookieStore.set("username", data.username),
                    cookieStore.set("userSlug", data.userSlug),
                    data?.member ? cookieStore.set("member", JSON.stringify(data.member)) : null,
                ]);
                // Redirect to homepage after successful login
                window.location.href = "/";
            }
        } catch (error) {
            console.error('Error logging in:', error);
            toast.error("Error al iniciar sesión", {
                position: "bottom-right",
            }).showToast();
        } finally {
            // Re-enable button
            event.target.querySelector('button').disabled = false;
        }
    };

    return (
        <Card color="transparent" shadow={false}>
            <Typography variant="h4" color="blue-gray">
                Inicia sesión
            </Typography>
            <Typography color="gray" className="mt-1 font-normal">
                Para poder calificar, comentar y leer tus mangas favoritos.
            </Typography>
            <form onSubmit={handleSubmit} className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-96">
                <div className="mb-1 flex flex-col gap-6">
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Usuario o Correo electrónico
                    </Typography>
                    <Input
                        size="lg"
                        placeholder="name@mail.com"
                        className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                        autoComplete='email'
                        labelProps={{
                            className: "before:content-none after:content-none",
                        }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Contraseña
                    </Typography>
                    <Input
                        type="password"
                        size="lg"
                        placeholder="********"
                        autoComplete='current-password'
                        className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                        labelProps={{
                            className: "before:content-none after:content-none",
                        }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Button type="submit" className="mt-6" fullWidth>
                    Iniciar sesión
                </Button>
                <Typography color="gray" className="mt-4 text-center font-normal">
                    No tienes una cuenta?{" "}
                    <a href="#" className="font-medium text-gray-900">
                        ¡Registrate aqui!
                    </a>
                </Typography>
            </form>
        </Card>
    );
}
