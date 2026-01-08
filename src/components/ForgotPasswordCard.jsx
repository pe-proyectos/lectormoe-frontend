import { useState, useEffect } from "react";
import { toast } from "react-toastify";
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
      <div className="w-96 bg-white rounded-lg shadow-lg">
        <div className="mb-4 grid h-28 p-2 place-items-center bg-gradient-to-r from-blue-900 to-pink-900 text-white rounded-t-lg">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            {_("forgot_password_title")}
          </h2>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <form onSubmit={handleSubmit} className="mt-8 mb-2 w-full">
            <p className="mb-2 text-center font-normal text-gray-600">
              {_("forgot_password_description")}
            </p>
            <div className="mb-1 flex flex-col gap-6">
              {!token && (
                <>
                  <label className="text-sm font-semibold text-blue-gray-700 -mb-3">
                    {_("email")}
                  </label>
                  <input
                    type="email"
                    placeholder="name@mail.com"
                    className="px-4 py-3 border border-blue-gray-200 rounded-lg focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </>
              )}
              {token && (
                <>
                  <label className="text-sm font-semibold text-blue-gray-700 -mb-3">
                    {_("new_password")}
                  </label>
                  <input
                    type="password"
                    placeholder="********"
                    className="px-4 py-3 border border-blue-gray-200 rounded-lg focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label className="text-sm font-semibold text-blue-gray-700 -mb-3">
                    {_("confirm_password")}
                  </label>
                  <input
                    type="password"
                    placeholder="********"
                    className="px-4 py-3 border border-blue-gray-200 rounded-lg focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </>
              )}
            </div>
            <button type="submit" className="mt-6 w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
              {token ? _("reset_password") : _("send_reset_email")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
