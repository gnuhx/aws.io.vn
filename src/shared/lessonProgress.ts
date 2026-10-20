import type { RoadmapId } from './roadmapProgress.ts'

/**
 * A published lesson page that a learner can mark as read.
 * - `id` is stable: it never changes when the lesson's title or slug changes. Never reuse or renumber IDs.
 * - `path` is the lesson's file under `content/`; update it if the file moves, keeping the ID.
 * - `roadmapItemId` is the roadmap checklist item the lesson covers (where the roadmap shows its read state).
 *
 * Read state is stored like roadmap items, in `roadmap_progress` with `status: 'completed'`; unread deletes it.
 * Lessons only take `completed`, and they are counted apart from roadmap items, so marking a lesson read never
 * completes a roadmap item or changes the roadmap's continue target.
 */
export type LessonProgressEntry = { id: string; path: string; roadmapItemId: string }

export const lessonProgressManifest: Record<RoadmapId, readonly LessonProgressEntry[]> = {
  "aws-saa-c03": [
    { id: "aws-saa-c03:lesson-0001", path: "aws-saa-c03/02-vpc-networking.md", roadmapItemId: "aws-saa-c03:item-0081" },
    { id: "aws-saa-c03:lesson-0002", path: "aws-saa-c03/03-compute-and-ecs.md", roadmapItemId: "aws-saa-c03:item-0009" },
    { id: "aws-saa-c03:lesson-0003", path: "aws-saa-c03/04-storage-and-database.md", roadmapItemId: "aws-saa-c03:item-0122" },
    { id: "aws-saa-c03:lesson-0004", path: "aws-saa-c03/05-security-and-operations.md", roadmapItemId: "aws-saa-c03:item-0227" },
    { id: "aws-saa-c03:lesson-0005", path: "aws-saa-c03/06-migration-and-transfer.md", roadmapItemId: "aws-saa-c03:item-0279" },
    { id: "aws-saa-c03:lesson-0006", path: "aws-saa-c03/07-cost-optimization.md", roadmapItemId: "aws-saa-c03:item-0279" },
    { id: "aws-saa-c03:lesson-0007", path: "aws-saa-c03/08-disaster-recovery-and-high-availability.md", roadmapItemId: "aws-saa-c03:item-0227" },
    { id: "aws-saa-c03:lesson-0008", path: "aws-saa-c03/09-load-balancing-and-auto-scaling.md", roadmapItemId: "aws-saa-c03:item-0009" },
    { id: "aws-saa-c03:lesson-0009", path: "aws-saa-c03/10-serverless-architectures.md", roadmapItemId: "aws-saa-c03:item-0195" },
    { id: "aws-saa-c03:lesson-0010", path: "aws-saa-c03/11-monitoring-and-observability.md", roadmapItemId: "aws-saa-c03:item-0227" },
    { id: "aws-saa-c03:lesson-0011", path: "aws-saa-c03/01-iam-intro.md", roadmapItemId: "aws-saa-c03:item-0001" },
    { id: "aws-saa-c03:lesson-0012", path: "aws-saa-c03/Module 5/SAA-C03_m5_docker-ecs.md", roadmapItemId: "aws-saa-c03:item-0195" },
    { id: "aws-saa-c03:lesson-0013", path: "aws-saa-c03/Module 6/SAA-C03_m6_deployment-management.md", roadmapItemId: "aws-saa-c03:item-0227" },
    { id: "aws-saa-c03:lesson-0014", path: "aws-saa-c03/Module 7/SAA-C03_m7_migration-transfer.md", roadmapItemId: "aws-saa-c03:item-0279" },
    { id: "aws-saa-c03:lesson-0015", path: "aws-saa-c03/Module 7/SAA-C03_m7_web-mobile-ml-cost.md", roadmapItemId: "aws-saa-c03:item-0291" },
    { id: "aws-saa-c03:lesson-0016", path: "aws-saa-c03/Module 5/SAA-C03_m5_serverless.md", roadmapItemId: "aws-saa-c03:item-0209" },
    { id: "aws-saa-c03:lesson-0017", path: "aws-saa-c03/Module 2/SAA-C03_m2_ec2_p1_lpic.md", roadmapItemId: "aws-saa-c03:item-0025" },
    { id: "aws-saa-c03:lesson-0018", path: "aws-saa-c03/Module 6/SAA-C03_m6_monitoring-logging-auditing.md", roadmapItemId: "aws-saa-c03:item-0244" },
    { id: "aws-saa-c03:lesson-0019", path: "aws-saa-c03/Module 7/SAA-C03_m7_practice-exam-final-prep.md", roadmapItemId: "aws-saa-c03:item-0303" },
    { id: "aws-saa-c03:lesson-0020", path: "aws-saa-c03/Module 6/SAA-C03_m6_security.md", roadmapItemId: "aws-saa-c03:item-0258" },
    { id: "aws-saa-c03:lesson-0021", path: "aws-saa-c03/Module 2/SAA-C03_m2_ec2_p2_lpic.md", roadmapItemId: "aws-saa-c03:item-0044" },
    { id: "aws-saa-c03:lesson-0022", path: "aws-saa-c03/Module 2/SAA-C03_m2_elb_asg_lpic.md", roadmapItemId: "aws-saa-c03:item-0052" },
    { id: "aws-saa-c03:lesson-0023", path: "aws-saa-c03/Module 4/SAA-C03_m4_tai-lieu-hoc-day-du.md", roadmapItemId: "aws-saa-c03:item-0174" },
    { id: "aws-saa-c03:lesson-0024", path: "aws-saa-c03/Module 4/luong-request.html", roadmapItemId: "aws-saa-c03:item-0174" },
    { id: "aws-saa-c03:lesson-0025", path: "aws-saa-c03/Module 4/scaling-elasticache.html", roadmapItemId: "aws-saa-c03:item-0175" },
    { id: "aws-saa-c03:lesson-0026", path: "aws-saa-c03/Module 4/dynamodb-suite.html", roadmapItemId: "aws-saa-c03:item-0176" },
    { id: "aws-saa-c03:lesson-0027", path: "aws-saa-c03/Module 4/data-analytics-suite.html", roadmapItemId: "aws-saa-c03:item-0182" },
    { id: "aws-saa-c03:lesson-0028", path: "aws-saa-c03/Module 5/SAA-C03_nha-may-nen_module5.html", roadmapItemId: "aws-saa-c03:item-0195" },
    { id: "aws-saa-c03:lesson-0029", path: "aws-saa-c03/Module 7/SAA-C03_nha-may-nen-tong-ket.html", roadmapItemId: "aws-saa-c03:item-0279" },
    { id: "aws-saa-c03:lesson-0030", path: "aws-saa-c03/12-final-architecture-review.md", roadmapItemId: "aws-saa-c03:item-0279" },
  ],
  "MCP": [
    { id: "MCP:lesson-0001", path: "MCP/Module 1/1-bai-hoc/Module-1-React-UI.md", roadmapItemId: "MCP:item-0013" },
    { id: "MCP:lesson-0002", path: "MCP/Module 2/Module-2-Walking-Skeleton.md", roadmapItemId: "MCP:item-0026" },
    { id: "MCP:lesson-0003", path: "MCP/Module 3/Module-3-MCP-Tools.md", roadmapItemId: "MCP:item-0039" },
    { id: "MCP:lesson-0004", path: "MCP/Module 4/Module-4-MCP-Resources-Prompts.md", roadmapItemId: "MCP:item-0051" },
    { id: "MCP:lesson-0005", path: "MCP/Module 5/Module-5-MCP-Data.md", roadmapItemId: "MCP:item-0063" },
    { id: "MCP:lesson-0006", path: "MCP/Module 6/Module-6-MCP-Client-Agent.md", roadmapItemId: "MCP:item-0076" },
    { id: "MCP:lesson-0007", path: "MCP/Module 7/Module-7-Remote-Auth-Deploy.md", roadmapItemId: "MCP:item-0086" },
    { id: "MCP:lesson-0008", path: "MCP/Module 7/Module-7/Module 7/m7-samples/README.md", roadmapItemId: "MCP:item-0086" },
    { id: "MCP:lesson-0009", path: "MCP/Module 1/1-bai-hoc/S1.1-react-cot-loi.md", roadmapItemId: "MCP:item-0013" },
    { id: "MCP:lesson-0010", path: "MCP/Module 1/1-bai-hoc/S1.2-effects-refs-custom-hooks.md", roadmapItemId: "MCP:item-0015" },
    { id: "MCP:lesson-0011", path: "MCP/Module 1/1-bai-hoc/S1.3-tailwind-shadcn.md", roadmapItemId: "MCP:item-0017" },
    { id: "MCP:lesson-0012", path: "MCP/Module 1/1-bai-hoc/S1.4-form-rhf-zod.md", roadmapItemId: "MCP:item-0019" },
    { id: "MCP:lesson-0013", path: "MCP/Module 1/1-bai-hoc/S1.5-accessibility-ui-tinh.md", roadmapItemId: "MCP:item-0021" },
    { id: "MCP:lesson-0014", path: "MCP/Module 1/2-code/nexus-module1/apps/ui/README.md", roadmapItemId: "MCP:item-0013" },
    { id: "MCP:lesson-0015", path: "MCP/Module 4/nexus-m4/nexus/apps/mcp-server/src/resources/glossary.md", roadmapItemId: "MCP:item-0051" },
    { id: "MCP:lesson-0016", path: "MCP/Module 5/nexus-m5/nexus/apps/mcp-server/src/resources/glossary.md", roadmapItemId: "MCP:item-0063" },
    { id: "MCP:lesson-0017", path: "MCP/Module 8/Module-8-Quality-Security-Ecosystem.md", roadmapItemId: "MCP:item-0099" },
    { id: "MCP:lesson-0018", path: "MCP/Module 9/Module-9-Nextjs-Auth.md", roadmapItemId: "MCP:item-0112" },
    { id: "MCP:lesson-0019", path: "MCP/Module 9/README.md", roadmapItemId: "MCP:item-0112" },
  ],
  "reactjs": [
    { id: "reactjs:lesson-0001", path: "reactjs/Module 1/Module-1-Component-JSX-Props.md", roadmapItemId: "reactjs:item-0005" },
    { id: "reactjs:lesson-0002", path: "reactjs/Module 2/Module-2-Hooks-Nang-Cao.md", roadmapItemId: "reactjs:item-0009" },
    { id: "reactjs:lesson-0003", path: "reactjs/Module 3/Module-3-State-Muc-App.md", roadmapItemId: "reactjs:item-0015" },
    { id: "reactjs:lesson-0004", path: "reactjs/Module 4/Module-4-Routing.md", roadmapItemId: "reactjs:item-0019" },
    { id: "reactjs:lesson-0005", path: "reactjs/Module 5/Module-5-Data-fetching.md", roadmapItemId: "reactjs:item-0024" },
    { id: "reactjs:lesson-0006", path: "reactjs/Module 6/Module-6-Styling.md", roadmapItemId: "reactjs:item-0027" },
    { id: "reactjs:lesson-0007", path: "reactjs/Module 7/Module-7-Performance-Patterns.md", roadmapItemId: "reactjs:item-0030" },
    { id: "reactjs:lesson-0008", path: "reactjs/Module 8/Module-8-TypeScript-React.md", roadmapItemId: "reactjs:item-0032" },
    { id: "reactjs:lesson-0009", path: "reactjs/Module 9/Module-9-Testing.md", roadmapItemId: "reactjs:item-0033" },
    { id: "reactjs:lesson-0010", path: "reactjs/Module 10/Module-10-Deployment-Build.md", roadmapItemId: "reactjs:item-0034" },
    { id: "reactjs:lesson-0011", path: "reactjs/Module 11/Module-11-NextJS-App-Router.md", roadmapItemId: "reactjs:item-0035" },
    { id: "reactjs:lesson-0012", path: "reactjs/Module 12/Module-12-Portfolio-Projects.md", roadmapItemId: "reactjs:item-0040" },
    { id: "reactjs:lesson-0013", path: "reactjs/Module 13/Module-13-Kien-truc-Review-code-AI.md", roadmapItemId: "reactjs:item-0045" },
  ],
}

const lessonsById = Object.fromEntries(
  Object.entries(lessonProgressManifest).map(([roadmapId, lessons]) => [roadmapId, new Map(lessons.map((lesson) => [lesson.id, lesson]))]),
) as Record<RoadmapId, Map<string, LessonProgressEntry>>

export const isLessonProgressId = (roadmapId: RoadmapId, itemId: string) => lessonsById[roadmapId].has(itemId)

/** Finds the read-tracking entry for a lesson file (path relative to `content/`). */
export const findLessonProgressEntry = (roadmapId: RoadmapId, path: string) =>
  lessonProgressManifest[roadmapId].find((lesson) => lesson.path === path)
