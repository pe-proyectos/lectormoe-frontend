import { useState } from 'react';
import { toast } from 'react-toastify';
import {
    Card,
    CardHeader,
    CardBody,
    Input,
    Button,
    Typography,
} from "@material-tailwind/react";
import { callAPI } from '../util/callApi';

export function RegisterCard() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Disable button to prevent multiple submissions
        event.target.querySelector('button').disabled = true;

        const formData = new FormData();
        formData.append('email', email);
        formData.append('username', username);
        formData.append('password', password);

        try {
            const { registered } = await callAPI(`/api/auth/register`, {
                method: "POST",
                body: formData,
            });

            if (!registered) {
                toast.error("Error al registrar usuario, intente nuevamente", {
                    position: "bottom-right",
                });
            } else {
                // Redirect to login page after successful registration
                window.location.href = "/login";
            }
        } catch (error) {
            toast.error(error?.message || "Error al registrar usuario", {
                position: "bottom-right",
            });
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
                    Registrate
                </Typography>
                <Typography className="font-normal p-2 hidden sm:block">
                    Registrate para poder guardar, calificar y comentar tus mangas favoritos.
                </Typography>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
                <form onSubmit={handleSubmit} className="mt-8 mb-2 w-96 max-w-80 mx-auto">
                    <div className="mb-1 flex flex-col gap-6">
                        <Typography variant="h6" color="blue-gray" className="-mb-3">
                            Correo electrónico
                        </Typography>
                        <Input
                            size="lg"
                            placeholder="name@mail.com"
                            autoComplete='email'
                            className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                            labelProps={{
                                className: "before:content-none after:content-none",
                            }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Typography variant="h6" color="blue-gray" className="-mb-3">
                            Nombre de usuario
                        </Typography>
                        <Input
                            type="text"
                            size="lg"
                            placeholder="Nombre de usuario"
                            autoComplete='off'
                            className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                            labelProps={{
                                className: "before:content-none after:content-none",
                            }}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <Typography variant="h6" color="blue-gray" className="-mb-3">
                            Contraseña
                        </Typography>
                        <Input
                            type="password"
                            size="lg"
                            placeholder="********"
                            className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                            labelProps={{
                                className: "before:content-none after:content-none",
                            }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="mt-6" fullWidth>
                        Registrarse
                    </Button>
                    <Typography color="gray" className="mt-4 text-center font-normal">
                        ¿Ya tienes una cuenta?{" "}
                        <a href="/login" className="font-medium text-gray-900">
                            Inicia sesión
                        </a>
                    </Typography>
                </form>
            </CardBody>
        </Card>
    );
}
