---
title: Monitoring and observability
topic: aws-saa-c03
order: 11
---

# Monitoring and observability

## The big picture
You cannot fix what you do not observe. Monitoring turns vague system health into measurable indicators that help engineers spot drift, failure, and cost issues early.

## Core building blocks
- CloudWatch: metrics, logs, and alarms.
- CloudTrail: record API actions and changes.
- X-Ray: trace service calls and latency.
- ALB access logs: understand request patterns and failures.

## Real project example
A team configures CloudWatch alarms on CPU, latency, and error rate. When a dependency slows down, the dashboard highlights the issue before users report it.

## Decision flow
- Need logs and metrics? Use CloudWatch.
- Need to audit who changed what? Use CloudTrail.
- Need to trace end-to-end latency? Use X-Ray.

## Good practice
Create a small set of meaningful alarms. Too many alerts create fatigue and lower response quality.

> **Pro tip:** observability is most valuable when it answers, “what changed, where, and what broke?”

## Looking back at the big picture
Monitoring is not an optional layer. It is how architecture teams keep confidence that the system is healthy under real-world load and failure.

## Self-draw
- Why are alarms more useful than raw logs alone?
- What does CloudTrail help you answer?
- Why is latency tracing important for distributed systems?
