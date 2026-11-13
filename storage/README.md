# Grandline Storage Architecture

This directory details the media and asset storage architecture for the Grandline application.

## Overview

Grandline integrates a secure, hybrid storage architecture designed for scalable media assets (such as photo memories) and application static assets:

1. **Cloudinary Cloud Storage (Memories & User Media)**:
   - Media assets uploaded within the Memories module are processed server-side through `Dayform.Infrastructure.Storage.CloudinaryImageStorageService`.
   - Direct client uploads to storage providers are intentionally avoided to ensure strict tenant isolation and server-side verification.
   - Files are validated against MIME type restrictions (`image/jpeg`, `image/png`, `image/webp`), magic-byte headers, and a strict 5 MB per-asset limit.
   - Deletion and replacement workflows clean up remote Cloudinary resources upon entity updates or deletions.
   - Automatic cleanup rollbacks occur if associated database transactions fail.

2. **Frontend Static Storage & CDN**:
   - Built assets, SVGs, typography, and styling tokens are managed by Vite and distributed via CDN/static hosting.

## Configuration

Server-side Cloudinary settings are configured via environment variables or ASP.NET Core User Secrets:

```bash
Cloudinary__CloudName=<your-cloudinary-cloud-name>
Cloudinary__ApiKey=<your-cloudinary-api-key>
Cloudinary__ApiSecret=<your-cloudinary-api-secret>
```

Refer to [documentation/API.md](../documentation/API.md) and [documentation/ARCHITECTURE.md](../documentation/ARCHITECTURE.md) for more details.
