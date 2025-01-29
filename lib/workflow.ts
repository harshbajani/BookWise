import config from "./config";
import { Client as QstashClient, resend } from "@upstash/qstash";
import { Client as WorkflowClient } from "@upstash/workflow";
export const workflowClient = new WorkflowClient({
  baseUrl: config.env.upstash.qstashToken!,
  token: config.env.upstash.qstashToken!,
});

const qstashClient = new QstashClient({
  token: config.env.upstash.qstashToken,
});

export const sendEmail = async ({
  email,
  subject,
  message,
}: {
  email: string;
  subject: string;
  message: string;
}) => {
  await qstashClient.publishJSON({
    api: {
      name: "email",
      provider: resend({ token: config.env.resendToken }),
    },
    body: {
      from: "Acme <harshbajani7@gmail.com>",
      to: [email],
      subject: subject,
      html: message,
    },
  });
};
