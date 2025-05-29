import { Metadata } from "next";
import App from "./app";
import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from "../lib/constants";
import { getFrameEmbedMetadata } from "../lib/utils";
import LinkWord from '@/components/LinkWord';

export const revalidate = 300;

export const metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [APP_OG_IMAGE_URL],
  },
  other: {
    ...getFrameEmbedMetadata(),
  },
};

export default function HomePage() {
  return (
    <>
      <LinkWord />
    </>
  );
}
