---
title: IAM Foundations
slug: iam-foundations
topic: aws-saa-c03
order: 1
module: 1
moduleTitle: Identity and Access Management
---

# IAM Foundations

## Why it matters
IAM gives every AWS identity a least-privilege boundary. If you do not define user, group, or role permissions clearly, access becomes broad and expensive to audit.

## Core concepts
- Users authenticate directly.
- Groups collect common permissions.
- Roles are assumed temporarily by services or users.
- Policies define allowed actions.

## Real project example
A small engineering team uses one admin account for bootstrapping and separate developer roles for prod support. This helps them rotate credentials without granting broad access to everyone.

> **Pro tip:** start with least privilege and add permission only when a real use case demands it.
