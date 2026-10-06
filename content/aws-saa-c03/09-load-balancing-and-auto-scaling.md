---
title: Load balancing and auto scaling
topic: aws-saa-c03
order: 9
---

# Load balancing and auto scaling

## The big picture
Elastic systems do not keep one oversized server forever. They distribute traffic and scale capacity dynamically as demand changes.

## Core building blocks
- ALB/NLB: distribute client traffic to healthy targets.
- Auto Scaling Group: add or remove compute based on demand.
- Target groups: define which instances or containers receive traffic.
- Health checks: remove unhealthy nodes from the pool.

## Real project example
A public API is exposed through an Application Load Balancer. The Auto Scaling Group adds instances during a launch campaign and shrinks them back down during quiet periods.

## Decision flow
- Need layer 7 routing and cookie-based traffic management? Use ALB.
- Need high-throughput TCP/UDP load distribution? Use NLB.
- Need capacity to respond to demand changes? Use Auto Scaling.

## Good practice
Use health checks and target groups to keep traffic away from unhealthy nodes. Avoid overprovisioning without an actual scale policy.

> **Pro tip:** a load balancer is not just a traffic distribute; it is also a health gate.

## Looking back at the big picture
Scaling is about both capacity and resilience. A healthy system needs traffic distribution plus automatic recovery from failures.

## Self-draw
- Why is health checking important in front of app nodes?
- Which type of load balancer fits HTTP-based routing?
- How does auto scaling reduce both waste and user impact?
