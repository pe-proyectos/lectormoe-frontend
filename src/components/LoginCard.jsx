import { useState } from 'react';
import { toast } from 'react-toastify';
import {
    Card,
    CardHeader,
    CardBody,
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
        <Card>
            <CardHeader
                variant="gradient"
                className="mb-4 grid h-28 p-2 place-items-center bg-gradient-to-r from-blue-900 to-pink-900 text-white"
            >
                <Typography className='text-2xl sm:text-5xl font-extrabold'>
                    Iniciar sesión
                </Typography>
                <Typography className="font-normal p-2 hidden sm:block">
                    Para poder calificar, comentar y leer tus mangas favoritos.
                </Typography>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
                <form onSubmit={handleSubmit} className="mt-8 mb-2 max-w-80 mx-auto">
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
            </CardBody>
        </Card>
    );
}
