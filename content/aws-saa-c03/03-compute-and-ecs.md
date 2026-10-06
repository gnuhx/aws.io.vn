---
title: Compute options and ECS
ntopic: aws-saa-c03
order: 3
---

# Compute options and ECS

## The big picture
AWS gives you several ways to run code: EC2 for full control, Lambda for event-driven execution, and ECS/EKS for container workloads. The right choice depends on control, scale, and operational effort.

## Core building blocks
- EC2: virtual servers with full control.
- Lambda: managed compute triggered by events.
- ECS: container orchestration for apps and services.
- ECR: container image registry.

## Real project example
An API backend is packaged in Docker and deployed to ECS Fargate. The application scales based on CPU and request volume without managing EC2 hosts.

## Decision flow
- Need maximum control and custom OS? Use EC2.
- Need short-lived functions triggered by events? Use Lambda.
- Need containers and service orchestration? Use ECS or EKS.

## Good practice
Use managed services when possible. They reduce operational burden and let the team focus on app behavior instead of host maintenance.

> **Pro tip:** match compute choice to workload shape. A bursty event processor is not the same as a long-running web app.

## Looking back at the big picture
Compute is the execution layer. Networking, storage, and security all support it, but the chosen compute model dictates how quickly the system can scale and how much operational burden it carries.

## Self-draw
- Which workload fits Lambda best?
- Why might ECS be better than running EC2 for a containerized service?
- What is the tradeoff between flexibility and operational simplicity?
