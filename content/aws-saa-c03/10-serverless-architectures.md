---
title: Serverless and event-driven patterns
topic: aws-saa-c03
order: 10
---

# Serverless and event-driven patterns

## The big picture
Serverless removes the need to manage servers for many workloads. It works especially well when tasks are triggered by events, short-lived, or bursty.

## Core building blocks
- Lambda: run code in response to events.
- API Gateway: public entry for HTTP APIs.
- SQS: decouple producers and consumers.
- SNS: fan-out notifications to many subscribers.

## Real project example
A file upload triggers an S3 event, which starts a Lambda function to process the file, publishes a message to SNS, and updates downstream services without direct coupling.

## Decision flow
- Need to respond to an event quickly and elastically? Use Lambda.
- Need to decouple asynchronous work? Use SQS.
- Need broadcast notifications to multiple subscribers? Use SNS.

## Good practice
Keep functions small, stateless, and designed for retry-safe processing. Event-driven patterns are powerful, but they need clear failure handling.

> **Pro tip:** if you need durable asynchronous work, queue it; do not rely on a synchronous request path alone.

## Looking back at the big picture
Serverless is best when the workload is decoupled, event-driven, and naturally bursty. It reduces operational overhead but requires stronger thinking about async flows.

## Self-draw
- What is the benefit of a queue between services?
- Where does Lambda shine over long-running EC2 workloads?
- Why should functions remain stateless?
