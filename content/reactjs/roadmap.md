# Roadmap React Đầy Đủ — Từ nền backend 6 năm → Code hook ầm ầm, không thua khái niệm, review được code AI
 
**Mục tiêu cụ thể của bạn** (ghim lại để tự chấm điểm cuối mỗi phase):
1. Gõ hook (useState/useEffect/useRef/useReducer/custom hook) mà không cần tra doc.
2. Nói chuyện Redux/Zustand/Context ngang hàng, biết khi nào dùng cái nào — không phải "nghe quen quen".
3. Đọc 1 requirement → hình dung ngay trong đầu: cấu trúc component, state đặt ở đâu, fetch chỗ nào, cần route/protect gì.
4. Đọc code AI (Copilot/Claude) generate ra → biết chỗ nào dư (over-engineer, re-render thừa), chỗ nào thiếu (thiếu cleanup, thiếu error state, thiếu key) để sửa trước khi merge.
Nguồn:
- **[NextAI]** = Complete React and NextJS course with AI powered Projects
- **[Academind]** = React - The Complete Guide (incl. Next.js, Redux)
- **[Modern]** = Modern React From The Beginning
- **[BigReact]** = Big React JS Course With AI (Redux - Router - Tailwind CSS)
---
 
## Phase 0 — JS sâu cho dân backend chuyển React (đừng bỏ qua, đây là chỗ hay lộ gốc backend)
 
- [ ] **Session 0.1 – Execution model & closures**
- **[NextAI]** *Javascript story - từ console đến v8 engine → How javascript executes the code - Behind the scene → Closures in javascript*
- Tự hỏi: giải thích được vì sao `setTimeout` trong loop bị "chạy sai giá trị i" nếu dùng `var` không?
- [ ] **Session 0.2 – Prototype, `this`, class thật sự hoạt động sao**
- **[NextAI]** *A masterclass on prototypes → Function, arrow function, THIS and context → Classes Objects and inheritance → Encapsulation, Polymorphism, Abstraction*
- Đây là chỗ 6 năm C#/OOP của bạn sẽ giúp học nhanh — nhưng đừng chủ quan, JS prototype khác class C# ở cơ chế delegation, không phải copy.
- [ ] **Session 0.3 – Async sâu: event loop, promise chaining, race condition**
- **[NextAI]** *Asynchronous Javascript with event loop → Promises and promise chaining → Aync-await and Promise all → Iterator and generators*
- **[BigReact]** *Race Condition* (bài này cực quan trọng — giải thích đúng lý do vì sao fetch trong `useEffect` cần cờ `ignore`/AbortController)
- [ ] **Session 0.4 – DOM/BOM thô (để hiểu React đang "giả lập" cái gì)**
- **[NextAI]** *DOM and BOM basics → Solving 5 challenges of DOM*
---
 
## Phase 1 — Component, JSX, Props: hiểu tới tận cơ chế render
 
- [ ] **Session 1.1 – Component tree, Fiber, Virtual DOM (câu hỏi phỏng vấn #1 luôn gặp)**
- **[Academind]** *It's All About Components! → How React Handles Components & How It Builds A "Component Tree"*
- **[BigReact]** *Components, Instances, Elements → What is Rendering → What is Virtual DOM → What is Fiber Tree → Rendering Scheme → What is Commit Phase*
- Tự test: vẽ được sơ đồ Fiber tree → Virtual DOM diff → Commit phase mà không nhìn tài liệu.
- [ ] **Session 1.2 – Props: mọi cách truyền, mọi pattern**
- **[Academind]** *Making Components Reusable with Props → Alternative Props Syntaxes → Component Composition: children Prop → Forwarding Props To Wrapped Elements → Setting Component Types Dynamically → Setting Default Prop Values*
- **[BigReact]** *How PropTypes Work → How the Children Prop Works → What is Component Composition → Explicit Component Passing*
- [ ] **Session 1.3 – Key prop & lý do state "lệch" khi list thay đổi**
- **[Academind]** *Why Keys Matter When Managing State! → More Reasons For Why Keys Matter → Using Keys For Resetting Components*
- **[BigReact]** *How the Key Prop Works*
- [ ] **Session 1.4 – Class components & lifecycle (không dùng thực tế, nhưng bị hỏi lý thuyết + đọc code cũ)**
- **[Academind]** *Adding a First Class-based Component → Working with State & Events → The Component Lifecycle → Lifecycle Methods In Action → Class-based Components & Context → Class-based vs Functional Components: A Summary*
- **[BigReact]** *Class vs Functional Components → Mount & Unmount*
- Tự test: map được `componentDidMount`/`componentDidUpdate`/`componentWillUnmount` ↔ `useEffect` tương ứng, nói vanh vách trong 30 giây.
---
 
## Phase 2 — Hooks nâng cao (trọng tâm để "code hook ầm ầm")
 
- [ ] **Session 2.1 – useState: update dựa trên state cũ, immutability**
- **[Academind]** *Updating State Based On Old State Correctly → Best Practice: Updating Object State Immutably*
- **[BigReact]** *Updating State Based on the Previous State → State vs Variables*
- [ ] **Session 2.2 – useEffect: dùng đúng, không lạm dụng**
- **[Academind]** *What's a "Side Effect"? → A Potential Problem with Side Effects: An Infinite Loop → Not All Side Effects Need useEffect → Understanding Effect Dependencies → Introducing useEffect's Cleanup Function → The Problem with Object & Function Dependencies*
- **[BigReact]** *What is a Side Effect? → Cleanup Function → Race Condition → Dependency Array in useEffect → useEffect without Dependency Array*
- **Quyết định nằm lòng:** nếu logic có thể tính trực tiếp trong lúc render (derived value) → KHÔNG cần useEffect. Đây là lỗi phổ biến nhất của code AI generate — nó rất hay quăng mọi thứ vào useEffect.
- [ ] **Session 2.3 – useRef / forwardRef / useImperativeHandle**
- **[Academind]** *Introducing Refs → Manipulating the DOM via Refs → Refs vs State Values → Using Refs for More Than "DOM Element Connections" → Forwarding Refs to Custom Components → Exposing Component APIs via useImperativeHandle*
- **[BigReact]** *Variable vs useState vs useRef → useRef for Accessing Elements*
- [ ] **Session 2.4 – useReducer (bắt buộc để hiểu Redux sau này — cùng 1 tư duy)**
- **[Academind]** *Introducing the useReducer Hook → Dispatching Actions & Editing State with useReducer*
- **[BigReact]** *First Look at useReducer Hook → useReducer Step by Step → Payload in Dispatch → More useReducer Logic → useReducer with Data Loading (Part 1–5)*
- [ ] **Session 2.5 – Custom hooks (kỹ năng dùng hằng ngày)**
- **[Academind]** *Revisiting the "Rules of Hooks" → Creating a Custom Hook → Custom Hook: Managing State & Returning State Values → Exposing Nested Functions From The Custom Hook → Using A Custom Hook in Multiple Components → Creating Flexible Custom Hooks*
- **[BigReact]** *How to Create a Custom Hook*
- **[NextAI]** *Create your first custom hook → Using context in multiple components → Finish up with custom hook features*
- [ ] **Session 2.6 – Portals & Error Boundaries**
- **[Academind]** *Introducing & Understanding "Portals" → Introducing Error Boundaries*
---
 
## Phase 3 — Quản lý state ở mức app (nói chuyện Redux/Zustand không thua ai)
 
- [ ] **Session 3.1 – Context API: đúng use-case, đúng giới hạn**
- **[Academind]** *Prop Drilling: Component Composition as a Solution → Introducing the Context API → Creating & Providing The Context → Linking the Context to State → What Happens When Context Values Change?*
- **[BigReact]** *How the Context API Works → Context API + Children Prop*
- **Hiểu rõ giới hạn:** Context re-render TOÀN BỘ consumer khi value đổi, không có selector như Redux/Zustand. Đây là câu hỏi phỏng vấn hay gặp: "vì sao không dùng Context thay Redux luôn cho gọn?"
- [ ] **Session 3.2 – Zustand (thực dụng, nên là công cụ default cho project cá nhân)**
- **[NextAI]** *State Management libraries → Create your first store in Zustand → Subscribe only to what you need → One store with multiple slices → Async actions for API calls*
- [ ] **Session 3.3 – Redux + Redux Toolkit (để KHÔNG THUA KHÁI NIỆM khi phỏng vấn/đọc code cũ)**
- **[Academind]** *Redux vs React Context → How Redux Works → Exploring The Core Redux Concepts → Creating a Redux Store for React → Dispatching Actions From Inside Components → Redux Challenges & Introducing Redux Toolkit → Adding State Slices → Working with Multiple Slices*
- **[Academind]** *Redux & Side Effects → Using an Action Creator Thunk → Handling Http States & Feedback with Redux*
- **[BigReact]** *Initial State & Reducer Function → Store & Provider → useSelector Hook → How Redux Thunk Works → Many Reducers in the App → Installing Redux Toolkit → Creating the First Slice → Loading Users with createAsyncThunk → Error Handling with createAsyncThunk*
- [ ] **Session 3.4 – Bảng quyết định (học thuộc, dùng khi đọc requirement)**
 
| Tình huống | Chọn |
|---|---|
| State chỉ dùng trong 1 cây con nhỏ, không đổi thường xuyên (theme, auth user) | Context |
| State toàn app, update thường xuyên, cần performance (không re-render thừa) | Zustand |
| Team lớn, cần dev-tools mạnh, cần middleware chuẩn hoá (logging, undo) | Redux Toolkit |
| State chỉ dùng trong 1 component, logic if/else phức tạp | useReducer local |
| Server data (API) | KHÔNG bỏ vào Redux/Zustand — dùng TanStack Query (xem Phase 5) |
 
---
 
## Phase 4 — Routing (đọc requirement → biết ngay cấu trúc route)
 
- [ ] **Session 4.1 – Routes cơ bản → nested → dynamic**
- **[Academind]** *Defining Routes → Adding a Second Route → Layouts & Nested Routes → Working with Navigation Links (NavLink) → Defining & Using Dynamic Routes → Understanding Relative & Absolute Paths → Working with Index Routes*
- **[BigReact]** *Setting Up Page Routes → How to Create Route Links → How NavLink Works → How the Outlet Component Works → How Index Attribute Works → useParams Hook*
- [ ] **Session 4.2 – Data loading với loader()/action() (pattern hiện đại, hay bị hỏi)**
- **[Academind]** *Data Fetching with a loader() → Using Data From A Loader → When Are loader() Functions Executed? → Error Handling with Custom Errors → Working with action() Functions → Behind-the-Scenes Work with useFetcher() → Deferring Data Fetching with defer()*
- **[Modern]** *Loaders Overview → Fetch Projects With Loader → Dynamic Route & Client Loader → React Router Actions Example → Form Validation With Actions*
- **[BigReact]** *Data Loading Before Router 6.4 → New Way of Data Loading → useNavigation for Loading State → Sending Data with Action*
- [ ] **Session 4.3 – Query params, location, navigate**
- **[BigReact]** *How useSearchParams Hook Works → How useLocation Hook Works → How useNavigate Hook Works → How the Navigate Component Works → Link vs Navigate vs useNavigate*
- [ ] **Session 4.4 – Auth & Protected routes (kinh điển)**
- **[Academind]** *How Authentication Works → Implementing the Auth Action → Attaching Auth Tokens to Outgoing Requests → Updating the UI Based on Auth Status → Adding Route Protection → Adding Automatic Logout → Managing the Token Expiration*
- **[Modern]** *Auth Context → Register User → Login User → Refresh Token On Page Refresh → Send Token With Request Using Axios Interceptor → Refresh Token When It Expires*
- [ ] **Session 4.5 – Lazy loading route (performance, hay bị hỏi)**
- **[Academind]** *Understanding Lazy Loading → Adding Lazy Loading*
---
 
## Phase 5 — Data fetching thực chiến (điểm yếu #1 của backend-dev)
 
- [ ] **Session 5.1 – Fetch chuẩn: loading/error/optimistic**
- **[Academind]** *How NOT to Send HTTP Requests → Sending HTTP Requests via useEffect → Handling Loading States → Handling HTTP Errors → Sending Data with POST Requests → Using Optimistic Updating → Deleting Data*
- [ ] **Session 5.2 – TanStack Query (server state — KHÔNG để chung với Redux/Zustand)**
- **[Academind]** *React Query: What & Why? → Installing & Using Tanstack Query → Understanding & Configuring Query Behaviors - Cache & Stale Data → Dynamic Query Functions & Query Keys → Changing Data with Mutations → Acting on Mutation Success & Invalidating Queries → Optimistic Updating*
- **[Modern]** *What Is TanStack Query? → Making Queries With useQuery Hook → Mutations - Follow/Unfollow User*
- **[NextAI]** *Introduction to Tanstack Query → useQuery → useMutation, Query Invalidation, and Optimistic UI*
- [ ] **Session 5.3 – Form actions & validation hiện đại**
- **[Academind]** *What are Form Actions? → Managing Form-dependent State with useActionState() → Updating the UI with useFormStatus() → Registering Multiple Form Actions → Adding Optimistic Updating*
- **[Academind]** *Validating Input on Every Keystroke → Validating Input Upon Lost Focus (Blur) → Validating Input Upon Form Submission → Mixing Custom & Built-in Validation Logic → Outsourcing Validation Logic*
---
 
## Phase 6 — Styling (đủ để tự tin làm UI, không cần chuyên sâu)
 
- [ ] **Session 6.1 – Tailwind thực chiến**
- **[BigReact]** *Setting Up Tailwind → Flexbox in Tailwind → Grid CSS in Tailwind → Gradients & Customizing Theme → Pseudo-classes and the Group Class → How the Peer Class Works → Animations in Tailwind*
- **[NextAI]** *Configure tailwind in react application → Building card with tailwind*
- [ ] **Session 6.2 – CSS Modules & Styled Components (đọc code cũ/team khác)**
- **[Academind]** *Scoping CSS Rules with CSS Modules → Introducing "Styled Components" → Styled Components: Pseudo Selectors, Nested Rules & Media Queries*
- [ ] **Session 6.3 – Animation (boost portfolio, không bắt buộc phỏng vấn junior nhưng ăn điểm demo)**
- **[Academind]** *Animating with CSS Transitions → Introducing Framer Motion → Animating Between Conditional Values → Orchestrating Multi-Element Animations → Scroll-based Animations*
---
 
## Phase 7 — Performance & Design Patterns (điểm phân biệt junior thường với junior giỏi)
 
- [ ] **Session 7.1 – memo/useMemo/useCallback: dùng đúng chỗ, không dùng bừa**
- **[Academind]** *Avoiding Component Function Executions with memo() → Understanding the useCallback() Hook → Understanding the useMemo() Hook → State Scheduling & Batching*
- **[BigReact]** *Memoization → Batching State Updates → How the useMemo Hook Works → How the useCallback Hook Works*
- **Checklist review code AI:** nếu thấy `useCallback`/`useMemo` bọc quanh mọi thứ mà component cha không có `memo()` → 90% là dư, AI hay lạm dụng optimize sớm (premature optimization).
- [ ] **Session 7.2 – Compound Components & Render Props (pattern hay gặp trong UI lib)**
- **[Academind]** *Introducing Compound Components → Managing Multi-Component State with the Context API → Grouping Compound Components → Introducing & Using Render Props*
---
 
## Phase 8 — TypeScript với React (đa số JD junior 2025–2026 yêu cầu)
 
- [ ] **Session 8.1**
- **[Academind]** *What & Why? → Installing & Using TypeScript → Understanding Type Inference → Understanding Type Aliases → Diving Into Generics → Creating a React + TypeScript Project → Working with Props & TypeScript → Adding a Data Model → Form Submissions In TypeScript Projects → Working with refs & useRef → The Context API & TypeScript*
- **[Modern]** *Introduction To Types (TypeScript)*
---
 
## Phase 9 — Testing (hay bị hỏi vòng phỏng vấn nhưng ít khóa dạy kỹ)
 
- [ ] **Session 9.1**
- **[Academind]** *Understanding Different Kinds Of Tests → What To Test & How To Test → Running a First Test → Writing Our First Test → Testing User Interaction & State → Testing Connected Components → Testing Asynchronous Code → Working With Mocks*
---
 
## Phase 10 — Deployment & Build (ngắn nhưng hay bị hỏi "làm sao đưa lên production")
 
- [ ] **Session 10.1**
- **[Academind]** *Deployment Steps → Building the Code For Production → Server-side Routing & Required Configuration*
- **[BigReact]** *npm run build → Project Deployment*
- **[Modern]** *Understanding The Build Process → Deploy To Vercel*
- **[NextAI]** *Build command in react → Take your react application to production*
---
 
## Phase 11 — Next.js App Router (bonus mạnh, nền backend của bạn sẽ học rất nhanh phần này)
 
- [ ] **Session 11.1 – Routing & Server/Client Components**
- **[NextAI]** *App Router vs Page Router → Nested & Dynamic Routing → Server Components → Client Components và khi nào chọn cái nào*
- **[Academind]** *Understanding React Server Components → Combining Server and Client Components → Using the use() Hook*
- [ ] **Session 11.2 – Route Handlers & Server Actions**
- **[NextAI]** *Route Handlers GET/POST/PUT/PATCH/DELETE → Deep Dive into Server Actions*
- [ ] **Session 11.3 – Data layer: Prisma/Drizzle + Auth**
- **[NextAI]** *ORM & Prisma → Drizzle ORM → Better Auth Google/GitHub → Clerk authentication*
- [ ] **Session 11.4 – Caching & Metadata/SEO (hay bị hỏi, hay bị AI code sai)**
- **[NextAI]** *Caching and Revalidating → Caching with Cache Components (Next.js 16) → Static vs Dynamic Metadata → Title Metadata Deep Dive → Favicons → Static/Dynamic Open Graph Images*
- [ ] **Session 11.5 – Project mẫu để thực hành trọn vẹn**
- **[NextAI]** *Notes App (full CRUD + Mongo) → ToDo App (Zustand + TanStack Query) → Contact Form Project*
---
 
## Phase 12 — Portfolio-boosting Projects (sau junior, để nổi bật hơn junior thường)
 
Chỉ làm sau khi Phase 0–9 vững. Đây là kho project chất lượng cao trong **[NextAI]**, không bắt buộc cho phỏng vấn junior nhưng giúp portfolio v­ượt trội:
- [ ] **LeetCode Clone** (Judge0 integration, role-based access, Prisma schema phức tạp)
- [ ] **AI Chat App với streaming** (model selection, streaming response, message persistence)
- [ ] **Payment integration** (Stripe / Polar / Razorpay)
- [ ] **Background jobs** (Inngest — AI agent jobs, long-running task)
- [ ] **Supabase/Convex real-time app**
---
 
## Phase 13 — Kiến trúc & Review code AI generate (mục tiêu cốt lõi bạn đề ra — làm cuối cùng, sau khi đã chắc Phase 0–9)
 
Đây không phải bài học từ khóa nào — là checklist bạn tự áp dụng khi đọc code AI generate hoặc tự thiết kế trước khi code:
 
- [ ] **13.1 – Đọc requirement → phác kiến trúc trong đầu (60 giây)**
1. Data này là *server state* (từ API) hay *client state* (UI-only: modal mở/đóng, tab đang chọn)? → server state luôn đi TanStack Query, không đi Redux/Zustand.
2. State này cần chia sẻ bao xa? 1 component → `useState`. Vài component con → lift up hoặc children prop. Toàn app, ít đổi → Context. Toàn app, đổi liên tục → Zustand/Redux.
3. Có cần side-effect không, hay tính được trực tiếp lúc render? → ưu tiên derived value, tránh useEffect thừa.
4. Route nào cần bảo vệ? Loader nào cần chạy trước khi render?
- [ ] **13.2 – Checklist review code AI generate (chỗ hay dư/thiếu nhất)**
 
| Vấn đề thường gặp ở code AI | Cách phát hiện |
|---|---|
| useEffect thừa để tính derived value | Nếu effect chỉ `setState` dựa trên props/state khác, không có I/O → xoá, tính thẳng trong render |
| Thiếu cleanup / AbortController khi fetch trong useEffect | Tìm `fetch(` trong useEffect không có `return () => ...` hoặc `AbortController` |
| useCallback/useMemo bọc bừa | Component cha không dùng `memo()` mà con vẫn bọc callback → dư |
| Đặt server data vào useState + useEffect tự fetch (thay vì TanStack Query) | Thiếu cache, thiếu refetch, thiếu race-condition handling → dấu hiệu AI code "cũ kiểu" |
| key={index} trong list có thể sắp xếp lại/xoá | Luôn kiểm tra key có phải ID ổn định không |
| State đặt quá cao (root) cho thứ chỉ 1 component con dùng | Prop drilling không cần thiết — nên "move state down" |
| Object/array literal tạo mới mỗi render truyền làm dependency | Gây effect chạy lại vô ích — kiểm tra dependency array có literal `{}`/`[]` trực tiếp không |
| Thiếu error boundary / error state khi mutation fail | Kiểm tra mọi `useMutation`/fetch POST có xử lý `onError` không |
 
- [ ] **13.3 – Tự luyện: mỗi tuần lấy 1 đoạn code AI generate ra, áp bảng trên, sửa lại, so sánh trước/sau.**
 
---
 
## Lộ trình thời gian gợi ý
 
| Tuần | Nội dung |
|---|---|
| 1 | Phase 0 (JS sâu) |
| 2 | Phase 1 |
| 3–4 | Phase 2 (trọng tâm) |
| 5 | Phase 3 (trọng tâm) |
| 6 | Phase 4 |
| 7 | Phase 5 |
| 8 | Phase 6–7 |
| 9 | Phase 8–9 |
| 10 | Phase 10 |
| 11–13 | Phase 11 (Next.js) |
| 14+ | Phase 12 (project nổi bật) song song Phase 13 (review skill, làm liên tục mỗi tuần) |
 
Phase 13 không phải học 1 lần rồi xong — nó là **thói quen** bạn mang theo suốt, áp dụng ngay từ tuần 3-4 trở đi mỗi khi có đoạn code AI generate, không cần đợi học hết roadmap mới bắt đầu review.
