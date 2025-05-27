import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Typography,
} from "@material-tailwind/react";
import { callAPI } from "../util/callApi";
import { getTranslator } from "../util/translate";

export function ForgotPasswordCard({ language, email: initialEmail, token }) {
  const _ = getTranslator(language);

  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    callAPI("/api/analytics", {
      method: "POST",
      includeIp: true,
      body: JSON.stringify({
        event: "view_forgot_password_page",
        path: window.location.pathname,
        userAgent: window.navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        payload: {},
      }),
    }).catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.target.querySelector("button").disabled = true;

    try {
      if (token) {
        // Reset password flow
        if (password !== confirmPassword) {
          throw new Error(_("passwords_dont_match"));
        }

        const formData = new FormData();
        formData.append("token", token);
        formData.append("password", password);

        await callAPI("/api/auth/reset-password", {
          method: "POST",
          body: formData,
        });

        toast.success(_("password_reset_success"), {
          position: "bottom-right",
        });
        window.location.href = "/login";
      } else {
        // Request reset email flow
        const formData = new FormData();
        formData.append("email", email);

        await callAPI("/api/auth/forgot-password", {
          method: "POST",
          body: formData,
        });

        toast.success(_("reset_email_sent"), {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error?.message || _("error_resetting_password"), {
        position: "bottom-right",
      });
    } finally {
      event.target.querySelector("button").disabled = false;
    }
  };

  return (
    <div className="flex justify-center py-12">
      <Card className="w-96">
        <CardHeader
          variant="gradient"
          className="mb-4 grid h-28 p-2 place-items-center bg-gradient-to-r from-blue-900 to-pink-900 text-white"
        >
          <Typography className="text-2xl sm:text-3xl font-extrabold">
            {_("forgot_password_title")}
          </Typography>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="mt-8 mb-2 w-full">
            <Typography color="gray" className="mb-2 text-center font-normal">
              {_("forgot_password_description")}
            </Typography>
            <div className="mb-1 flex flex-col gap-6">
              {!token && (
                <>
                  <Typography variant="h6" color="blue-gray" className="-mb-3">
                    {_("email")}
                  </Typography>
                  <Input
                    size="lg"
                    placeholder="name@mail.com"
                    className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                    autoComplete="email"
                    labelProps={{
                      className: "before:content-none after:content-none",
                    }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    crossOrigin={undefined}
                  />
                </>
              )}
              {token && (
                <>
                  <Typography variant="h6" color="blue-gray" className="-mb-3">
                    {_("new_password")}
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
                    crossOrigin={undefined}
                  />
                  <Typography variant="h6" color="blue-gray" className="-mb-3">
                    {_("confirm_password")}
                  </Typography>
                  <Input
                    type="password"
                    size="lg"
                    placeholder="********"
                    className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                    labelProps={{
                      className: "before:content-none after:content-none",
                    }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    crossOrigin={undefined}
                  />
                </>
              )}
            </div>
            <Button type="submit" className="mt-6" fullWidth>
              {token ? _("reset_password") : _("send_reset_email")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
