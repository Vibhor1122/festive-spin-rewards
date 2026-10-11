
type Msg91Response = {
  type?: string;
  message?: string;
  [key: string]: unknown;
};

type Msg91Callback = (
  response: Msg91Response | string
) => void;

declare global {
  interface Window {
    initSendOTP?: (config: {
      widgetId: string;
      tokenAuth: string;
      exposeMethods: boolean;
      success: (response: unknown) => void;
      failure: (error: unknown) => void;
    }) => void;

    sendOtp?: (
      phone: string,
      success: Msg91Callback,
      failure: (error: unknown) => void
    ) => void;

    verifyOtp?: (
      otp: string,
      success: Msg91Callback,
      failure: (error: unknown) => void
    ) => void;
  }
}

export function parseMsg91Response(
  response: Msg91Response | string
): Msg91Response {
  if (typeof response === "string") {
    return JSON.parse(response);
  }

  return response;
}

export function sendMsg91Otp(phone: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.sendOtp) {
      reject(new Error("MSG91 is not ready."));
      return;
    }

    window.sendOtp(
      `91${phone}`,
      (response) => {
        try {
          const result = parseMsg91Response(response);

          console.log(
            "MSG91 SEND FIELDS:",
            Object.keys(result)
          );

          if (result.type !== "success") {
            throw new Error("Could not send OTP.");
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      },
      () => reject(new Error("Could not send OTP."))
    );
  });
}

export function verifyMsg91Otp(
  code: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.verifyOtp) {
      reject(new Error("MSG91 is not ready."));
      return;
    }

    window.verifyOtp(
      code,
      (response) => {
        try {
          const result = parseMsg91Response(response);

          console.log(
            "MSG91 VERIFY FIELDS:",
            Object.keys(result)
          );

          if (
            result.type !== "success" ||
            typeof result.message !== "string"
          ) {
            throw new Error("Incorrect OTP.");
          }

          resolve(result.message);
        } catch (error) {
          reject(error);
        }
      },
      () => reject(new Error("OTP verification failed."))
    );
  });
}
