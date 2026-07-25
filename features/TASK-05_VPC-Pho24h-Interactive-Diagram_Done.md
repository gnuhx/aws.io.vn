# TASK-05 — AWS VPC "Pho24h Factory" Interactive Diagram

**Status: Done**

Source doc: [docs/topics/vpc.md](../docs/topics/vpc.md)

## Scope
A standalone blog post with an interactive factory-themed flowchart of VPC components:
hover tooltips, click-to-open side panel (concept / real example / funny story / exam tip),
Framer Motion animations, pure CSS/SVG connectors (no chart library).

## Evidence
- `src/pages/VpcPage.tsx` routed at `/post/aws-vpc-pho24h` in `src/App.tsx`.
- `src/components/FlowChart/FlowChart.tsx` + `FlowNode.tsx` + `flowchart.types.ts` implement
  the node graph and SVG arrow connectors (`getArrowPoints`), matching the spec's connection
  requirement (arrows are inlined in `FlowChart.tsx` rather than a separate `FlowArrow.tsx`
  file, a structural deviation only).
- `src/components/SidePanel/SidePanel.tsx` implements the sliding detail panel.
- Hover tooltip (400ms delay, flips position near top of screen) implemented directly in
  `FlowNode.tsx` rather than a separate `Tooltip.tsx` component — same behavior as spec'd.
- `src/data/vpc-nodes.data.ts` and `src/hooks/useSelectedNode.ts` exist as specified.
- All 12+ VPC nodes present with concept/real-example/funny-story/exam-tip fields.

## Notes
Functionally complete against the spec. Only deviation is file organization (tooltip/arrow
logic inlined instead of split into their own files) — no missing functionality found.
