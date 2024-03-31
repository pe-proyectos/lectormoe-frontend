import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Tooltip,
    Avatar,
    Button,
} from "@material-tailwind/react";

export function NewsCard({ news, props }) {
    const formatDate = (date) => {
        if (!date) return '';
        const dt = new Date(date);
        const diff = new Date() - dt;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        if (months > 0) return `${months} Mes${months > 1 ? 'es' : ''}`;
        if (weeks > 0) return `${weeks} Semana${weeks > 1 ? 's' : ''}`;
        if (days > 0) return `${days} Día${days > 1 ? 's' : ''}`;
        return 'Hoy';
    }

    return (
        <Card className="w-full sm:max-w-[16rem] lg:max-w-[26rem] shadow-sm overflow-hidden" {...props}>
            {news?.imageUrl && (
                <CardHeader
                    floated={false}
                    shadow={false}
                    color="transparent"
                    className="m-0 rounded-none"
                >
                    <img
                        src={news?.imageUrl}
                        className='h-40 object-cover w-full'
                        alt={news?.title}
                    />
                </CardHeader>
            )}
            <CardBody className='px-4 pt-4 pb-1'>
                <Typography variant="h5" color="blue-gray">
                    {news?.title}
                </Typography>
                <Typography variant="lead" color="gray" className="mt-3 font-normal text-md">
                    {news?.description}
                </Typography>
            </CardBody>
            <CardFooter className="flex items-center justify-between px-4 pt-1 pb-4">
                <div className="flex items-center -space-x-3">
                    <Tooltip content={news?.member?.user?.username || ""}>
                        <Avatar
                            size="sm"
                            variant="circular"
                            alt={news?.member?.user?.username || ""}
                            src="https://cdn2.iconfinder.com/data/icons/web-solid/32/user-512.png"
                            className="border-2 border-white hover:z-10"
                        />
                    </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                    <Typography className="font-normal text-sm">{formatDate(news?.createdAt)} - {new Date(news?.createdAt).toLocaleDateString()}</Typography>
                    <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => location.href = `/news/${news?.slug}`}
                    >
                        Leer más
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}