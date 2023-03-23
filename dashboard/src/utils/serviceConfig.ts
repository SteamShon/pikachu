import type { ServiceConfig } from "@prisma/client";
import { extractValue } from "./json";

export function extractS3Region(serviceConfig?: ServiceConfig | null) {
  if (!serviceConfig) return undefined;

  return extractValue({
    object: serviceConfig?.s3Config,
    paths: ["s3Region"],
  }) as string | undefined;
}

export function extractS3AccessKeyId(serviceConfig?: ServiceConfig | null) {
  if (!serviceConfig) return undefined;

  return extractValue({
    object: serviceConfig?.s3Config,
    paths: ["s3AccessKeyId"],
  }) as string | undefined;
}

export function extractS3SecretAccessKey(serviceConfig?: ServiceConfig | null) {
  if (!serviceConfig) return undefined;

  return extractValue({
    object: serviceConfig?.s3Config,
    paths: ["s3SecretAccessKey"],
  }) as string | undefined;
}

export function extractS3Buckets(serviceConfig?: ServiceConfig | null) {
  if (!serviceConfig) return undefined;

  return extractValue({
    object: serviceConfig?.s3Config,
    paths: ["s3Buckets"],
  }) as string | undefined;
}

export function extractBuilderPrivateKey(serviceConfig?: ServiceConfig | null) {
  if (!serviceConfig) return undefined;

  return extractValue({
    object: serviceConfig?.builderConfig,
    paths: ["privateKey"],
  }) as string | undefined;
}

export function extractBuilderPublicKey(serviceConfig?: ServiceConfig | null) {
  if (!serviceConfig) return undefined;

  return extractValue({
    object: serviceConfig?.builderConfig,
    paths: ["publicKey"],
  }) as string | undefined;
}
