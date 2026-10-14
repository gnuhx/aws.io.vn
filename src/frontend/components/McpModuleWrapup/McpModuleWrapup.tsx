import { useState, type FormEvent } from 'react'
import styles from './McpModuleWrapup.module.css'

type Question = {
  prompt: string
  choices: [string, string, string, string]
  answer: number
  why: string
}

type ModuleWrapup = {
  recap: string[]
  challenge: string
  acceptance: string[]
  exitChecks: string[]
  questions: [Question, Question, Question, Question, Question]
}

const wrapups: Record<number, ModuleWrapup> = {
  1: {
    recap: [
      'React UI phản ánh props và state; tránh lưu state có thể tính ra từ dữ liệu khác.',
      'Effect dành cho đồng bộ với hệ thống bên ngoài; event handler xử lý hành động người dùng.',
      'Nexus cần responsive và dùng được bằng bàn phím, không chỉ đẹp trên desktop.',
    ],
    challenge: 'Hoàn thiện một màn hình chat tĩnh cho Nexus với danh sách tin nhắn, trạng thái tool đang chạy và composer có thể dùng bằng bàn phím.',
    acceptance: [
      'Không dùng state trùng lặp; danh sách dùng key ổn định.',
      'Luồng chính dùng được bằng bàn phím và hiển thị tốt trên điện thoại.',
      'Đối chiếu Accessibility với tiêu chí trong roadmap trước khi sang M2.',
    ],
    exitChecks: [
      'Giải thích được vì sao component render lại và cách tránh render thừa.',
      'Giao diện Nexus responsive và dùng được bằng bàn phím.',
    ],
    questions: [
      { prompt: 'Danh sách todo được lọc theo từ khóa. Nên lưu kết quả đã lọc ở đâu?', choices: ['Trong một state thứ hai', 'Tính từ danh sách gốc và từ khóa khi render', 'Trong localStorage mỗi lần render', 'Trong useEffect rồi setState'], answer: 1, why: 'Kết quả lọc suy ra được từ hai giá trị hiện có, nên tính trong lúc render để tránh state lệch nhau.' },
      { prompt: 'Khi nào useEffect phù hợp nhất?', choices: ['Tính tổng từ một mảng', 'Xử lý nút Submit', 'Đăng ký và dọn một event listener bên ngoài React', 'Đổi tên biến'], answer: 2, why: 'Effect đồng bộ component với hệ thống bên ngoài và cần cleanup khi dependency đổi hoặc component unmount.' },
      { prompt: 'Vì sao không nên dùng index làm key cho danh sách có thể sắp xếp?', choices: ['Index làm CSS chậm', 'React có thể gắn state của phần tử vào sai item sau khi danh sách đổi', 'Key bắt buộc là UUID', 'Index không được TypeScript hỗ trợ'], answer: 1, why: 'Key ổn định giúp React nhận diện đúng item khi thêm, xóa hoặc sắp xếp lại.' },
      { prompt: 'Một input được điều khiển bởi React thường lấy giá trị hiện tại từ đâu?', choices: ['DOM là nguồn duy nhất', 'State được truyền vào value và cập nhật qua event handler', 'Một biến global', 'Một effect chạy mỗi giây'], answer: 1, why: 'Controlled input dùng state làm nguồn sự thật và cập nhật state trong onChange.' },
      { prompt: 'Cách nào phù hợp để kiểm tra luồng chính hỗ trợ bàn phím?', choices: ['Chỉ xem ảnh chụp màn hình', 'Đi qua luồng bằng Tab, Shift+Tab, Enter và Space', 'Chỉ chạy TypeScript compiler', 'Tăng kích thước màn hình'], answer: 1, why: 'Điều khiển thực tế bằng bàn phím giúp phát hiện thứ tự focus và thao tác không truy cập được.' },
    ],
  },
  2: {
    recap: [
      'Walking skeleton nối trình duyệt → Next.js → LLM → MCP → MongoDB thành một luồng chạy được.',
      'MCP server dùng stdio phải giữ stdout sạch cho JSON-RPC; log ghi ra stderr.',
      'Secret chỉ ở server; triển khai cần HTTPS, streaming đúng qua Nginx và MongoDB không mở công khai.',
    ],
    challenge: 'Chạy câu hỏi khách hàng từ một trình duyệt bên ngoài qua toàn bộ Nexus, rồi chứng minh luồng vẫn hoạt động sau khi EC2 khởi động lại.',
    acceptance: [
      'Câu trả lời stream dần và đi qua MCP tool tới MongoDB.',
      'API key không xuất hiện trong bundle client; cổng MongoDB không mở ra internet.',
      'Nginx không gom response streaming và service tự lên sau reboot.',
    ],
    exitChecks: [
      'Từ ngoài mạng, xác nhận được câu hỏi → LLM → MCP tool → Mongo → câu trả lời stream về.',
      'Vẽ và giải thích được các tầng cùng dạng dữ liệu trên từng đoạn của request.',
    ],
    questions: [
      { prompt: 'Trong MCP stdio transport, log chẩn đoán nên ghi ra đâu?', choices: ['stdout', 'stderr', 'Cùng dòng với JSON-RPC', 'Response của tool'], answer: 1, why: 'stdout là kênh protocol; log ở đó có thể làm hỏng thông điệp MCP.' },
      { prompt: 'Nên đặt API key của LLM ở đâu?', choices: ['Trong React bundle', 'Trong biến môi trường phía server', 'Trong query string gửi từ trình duyệt', 'Trong prompt hệ thống'], answer: 1, why: 'Key chỉ được đọc ở server để không bị phát tán tới client.' },
      { prompt: 'Nginx gom các chunk response làm chat không hiện dần. Cần kiểm tra gì?', choices: ['Tắt buffering cho route streaming', 'Mở cổng MongoDB', 'Tăng số lượng CSS', 'Đổi JSON-RPC thành stdout log'], answer: 0, why: 'Proxy buffering có thể giữ response cho đến khi đầy buffer thay vì chuyển từng chunk.' },
      { prompt: 'Cổng nào không nên mở công khai trong thiết kế này?', choices: ['HTTPS 443', 'HTTP 80 để redirect', 'MongoDB 27017', 'SSH giới hạn theo IP quản trị'], answer: 2, why: 'MongoDB cần ở mạng nội bộ hoặc chỉ được truy cập qua lớp ứng dụng.' },
      { prompt: 'Một walking skeleton nên ưu tiên điều gì?', choices: ['Hoàn thiện mọi tính năng UI trước', 'Nối sớm các tầng chính để kiểm tra đường đi end-to-end', 'Chỉ viết tài liệu kiến trúc', 'Tối ưu từng hàm trước khi tích hợp'], answer: 1, why: 'Mục tiêu là làm lộ sớm lỗi tích hợp giữa các tầng, dù sản phẩm ban đầu còn đơn giản.' },
    ],
  },
  3: {
    recap: [
      'Tên, mô tả và schema giúp model chọn đúng tool và gửi input hợp lệ.',
      'Lỗi schema khác lỗi nghiệp vụ; output có cấu trúc nên dùng outputSchema và structuredContent.',
      'Annotation mô tả mức độ an toàn; timeout, progress và logging cần tôn trọng host/client.',
    ],
    challenge: 'Thiết kế một tool Nexus mới có input/output schema, lỗi có hướng dẫn sửa và annotation phù hợp; thêm một kiểm tra gọi tool.',
    acceptance: [
      'Input sai bị schema chặn; lỗi nghiệp vụ trả isError cùng gợi ý hữu ích.',
      'Kết quả thành công có cấu trúc ổn định và annotation đúng hành vi.',
      'Tool ngoài có timeout; log không làm bẩn stdout.',
    ],
    exitChecks: [
      'C50 Lab 01–10 xanh hết.',
      'Từ file trống, viết được tool có input/output schema, annotation và lỗi chuẩn trong 15 phút.',
    ],
    questions: [
      { prompt: 'Input không đúng định dạng email nên được xử lý ở đâu?', choices: ['Trong schema đầu vào', 'Trong log sau khi tool chạy', 'Bằng cách bỏ qua validation', 'Ở giao diện sau khi nhận kết quả'], answer: 0, why: 'Lỗi hình dạng input nên bị schema chặn trước khi handler thực hiện công việc.' },
      { prompt: 'Không tìm thấy khách hàng là lỗi gì phù hợp nhất?', choices: ['Lỗi cú pháp JSON-RPC luôn làm process thoát', 'Lỗi nghiệp vụ trả isError và gợi ý bước tiếp theo', 'Kết quả thành công giả', 'Lỗi TypeScript compile'], answer: 1, why: 'Handler đã nhận input hợp lệ nhưng không tìm thấy dữ liệu; phản hồi nên giúp model biết cách tiếp tục.' },
      { prompt: 'Vì sao khai báo outputSchema hữu ích?', choices: ['Nó thay thế transport', 'Nó mô tả và kiểm tra cấu trúc kết quả trả về', 'Nó mã hóa API key', 'Nó tự tạo giao diện React'], answer: 1, why: 'Output schema giúp host và client hiểu cấu trúc dữ liệu và phát hiện kết quả sai dạng.' },
      { prompt: 'Tool xóa dữ liệu nên mô tả thế nào?', choices: ['readOnlyHint: true', 'destructiveHint: true', 'idempotentHint: true trong mọi trường hợp', 'Không cần annotation'], answer: 1, why: 'destructiveHint báo cho host rằng thao tác có thể phá hủy hoặc thay đổi dữ liệu.' },
      { prompt: 'Một API bên ngoài có thể treo. Hành vi nào tốt nhất?', choices: ['Chờ vô hạn', 'Đặt timeout và dịch lỗi thành thông điệp an toàn, dễ hiểu', 'In stack trace ra stdout', 'Retry vô hạn mọi request'], answer: 1, why: 'Timeout giới hạn thời gian; lỗi đã dịch tránh treo tool và không lộ chi tiết nội bộ.' },
    ],
  },
  4: {
    recap: [
      'Tools thực hiện hành động; resources cung cấp dữ liệu theo URI; prompts định nghĩa mẫu tương tác.',
      'Resource template dùng tham số URI để đọc một tài nguyên cụ thể.',
      'MIME type, subscribe/update và resource_link giúp client dùng dữ liệu đúng cách, gọn context.',
    ],
    challenge: 'Tạo một workflow Nexus dùng resource để cung cấp dữ liệu khách hàng và prompt để lập brief theo team; giải thích vì sao không biến mọi thứ thành tool.',
    acceptance: [
      'Chọn đúng primitive cho hành động, dữ liệu đọc và mẫu prompt.',
      'Resource có URI/MIME type và trả dữ liệu có cấu trúc dễ hiểu.',
      'Prompt nhận argument cần thiết và xử lý giá trị tùy chọn hợp lý.',
    ],
    exitChecks: [
      'C50 Lab 11–18 xanh hết.',
      'Với 5 tính năng, chọn đúng tool, resource hoặc prompt và giải thích được lựa chọn.',
    ],
    questions: [
      { prompt: 'Người dùng muốn xem nội dung một tài liệu theo URI. Primitive nào phù hợp nhất?', choices: ['Resource', 'Tool xóa', 'Prompt template', 'Sampling request'], answer: 0, why: 'Resource biểu diễn dữ liệu có thể đọc được và định danh bằng URI.' },
      { prompt: 'Tính năng gửi email cho khách hàng là gì?', choices: ['Resource vì có nội dung', 'Tool vì nó thực hiện hành động', 'Prompt vì có câu chữ', 'Completion vì có argument'], answer: 1, why: 'Gửi email tạo ra tác động bên ngoài, do đó là hành động của tool.' },
      { prompt: 'Prompt template chủ yếu giúp gì?', choices: ['Đưa ra một mẫu tương tác có argument cho host/client', 'Thay thế mọi tool', 'Lưu database lâu dài', 'Xác thực OAuth token'], answer: 0, why: 'Prompt là mẫu để người dùng hoặc host khởi tạo một tương tác với tham số.' },
      { prompt: 'Một resource chứa JSON nên khai báo gì để client diễn giải tốt hơn?', choices: ['MIME type phù hợp như application/json', 'destructiveHint', 'HTTP Host header', 'Một access token trong URI'], answer: 0, why: 'MIME type cho client biết dạng nội dung của resource.' },
      { prompt: 'Tool tìm thấy 100 tài liệu lớn. Cách nào giảm phình context?', choices: ['Nhồi toàn bộ nội dung vào text result', 'Trả resource_link tới từng tài liệu phù hợp', 'Bỏ URI', 'Chuyển thành log stdout'], answer: 1, why: 'resource_link cho phép tham chiếu tới nội dung cần đọc thay vì nhúng mọi dữ liệu vào kết quả.' },
    ],
  },
  5: {
    recap: [
      'Ranh giới dữ liệu cần allow-list, giới hạn quyền và validation trước khi truy cập.',
      'Path phải được chuẩn hóa và kiểm tra cả symlink; truy vấn Mongo cần giới hạn toán tử.',
      'Pagination bằng cursor và tổng hợp tại nguồn giúp giảm tải và giữ context nhỏ.',
    ],
    challenge: 'Thêm một workflow tìm và xuất dữ liệu an toàn: lọc theo tiêu chí, phân trang và trả dữ liệu tổng hợp hoặc file thay vì dump collection.',
    acceptance: [
      'Path traversal, toán tử không cho phép và input không hợp lệ đều bị từ chối.',
      'Cursor không làm trùng hoặc sót bản ghi khi đi hết các trang.',
      'Kết quả lớn được giới hạn hoặc tổng hợp để không vượt ngân sách context.',
    ],
    exitChecks: [
      'C50 Lab 19–28 xanh hết.',
      'Nêu được 5 cách lạm dụng tool truy cập dữ liệu và biện pháp chặn tương ứng.',
    ],
    questions: [
      { prompt: 'Cách chắc chắn hơn để giới hạn truy vấn Mongo là gì?', choices: ['Chặn vài toán tử nguy hiểm bằng blacklist', 'Allow-list toán tử và trường được hỗ trợ', 'Cho model gửi pipeline tùy ý', 'Chỉ dựa vào prompt'], answer: 1, why: 'Allow-list giới hạn bề mặt truy vấn theo các thao tác đã thiết kế và kiểm tra.' },
      { prompt: 'Kiểm tra path traversal nên làm gì với symlink?', choices: ['Bỏ qua vì đường dẫn đã normalize', 'Resolve đường dẫn thật rồi đảm bảo vẫn trong thư mục cho phép', 'Tin tên file do người dùng gửi', 'Mở quyền đọc toàn ổ đĩa'], answer: 1, why: 'Symlink có thể trỏ ra ngoài thư mục gốc dù chuỗi đường dẫn ban đầu trông hợp lệ.' },
      { prompt: 'Khi API trả 429 kèm Retry-After, client nên làm gì?', choices: ['Retry ngay liên tục', 'Tôn trọng thời gian chờ và ngân sách request', 'Retry POST bất kể trạng thái', 'Bỏ header'], answer: 1, why: 'Retry-After cho biết thời gian chờ; retry cần bị giới hạn và POST cần tính idempotency.' },
      { prompt: 'Vì sao dùng cursor pagination thay offset cho bộ dữ liệu thay đổi?', choices: ['Cursor có thể duy trì vị trí ổn định giữa các trang', 'Cursor làm mọi kết quả thành cache', 'Offset không hỗ trợ MongoDB', 'Cursor tự mã hóa dữ liệu'], answer: 0, why: 'Cursor dựa trên khóa sắp xếp giúp duyệt liên tục ổn định hơn khi tập dữ liệu thay đổi.' },
      { prompt: 'Cách nào giảm nguy cơ làm phình context khi báo cáo doanh thu?', choices: ['Trả mọi document nguồn', 'Aggregate theo tiêu chí ở database rồi trả số tổng hợp', 'Tạo một tool cho mỗi record', 'Bỏ giới hạn output'], answer: 1, why: 'Tổng hợp tại nguồn gửi đúng thông tin cần thiết thay vì toàn bộ bản ghi thô.' },
    ],
  },
  6: {
    recap: [
      'MCP client quản lý kết nối, capability, tools/list và tools/call; host điều phối trải nghiệm agent.',
      'Sampling, elicitation, roots và completion là khả năng client có thể cung cấp, không phải lúc nào cũng có.',
      'Agent cần giới hạn bước, xử lý lỗi và không tin mù quáng nội dung do model trả về.',
    ],
    challenge: 'Dựng mini agent CLI gọi ít nhất hai tool theo nhiều bước, xử lý isError rõ ràng và dừng an toàn khi đạt giới hạn bước.',
    acceptance: [
      'Client đóng transport gọn và kiểm tra capability trước khi gọi tính năng tùy chọn.',
      'Elicitation không yêu cầu bí mật; hành động phá hủy cần xác nhận.',
      'Agent dừng tại maxSteps và giải thích được phần nào thuộc MCP, host và LLM.',
    ],
    exitChecks: [
      'C50 Lab 29–35 xanh hết.',
      'Giải thích được phần nào của agent là MCP và phần nào thuộc host/LLM.',
    ],
    questions: [
      { prompt: 'Client MCP nên làm gì sau khi hoàn tất phiên làm việc?', choices: ['Giữ process sống vô hạn', 'Đóng client và transport gọn gàng', 'Ghi log vào stdout', 'Gọi lại initialize liên tục'], answer: 1, why: 'Đóng kết nối giúp giải phóng process, stream và tài nguyên liên quan.' },
      { prompt: 'Server gửi sampling request. Ai cung cấp model và quyền phê duyệt?', choices: ['MCP transport tự chọn model', 'Client/host theo chính sách của nó', 'MongoDB', 'Tool gọi trực tiếp API key trình duyệt'], answer: 1, why: 'Sampling là yêu cầu từ server tới client; host kiểm soát model và chính sách người dùng.' },
      { prompt: 'Elicitation an toàn nên tránh yêu cầu gì?', choices: ['Chọn một thư mục', 'Xác nhận một hành động', 'Mật khẩu, token hoặc API key', 'Một giá trị không nhạy cảm'], answer: 2, why: 'Không nên dùng elicitation để thu thập thông tin xác thực nhạy cảm.' },
      { prompt: 'Khi tool trả isError, client nên hiểu thế nào?', choices: ['Luôn là exception transport', 'Là kết quả tool báo lỗi nghiệp vụ/protocol, cần đọc và quyết định bước tiếp theo', 'Là thành công', 'Process cần thoát ngay'], answer: 1, why: 'isError thuộc nội dung kết quả tool, khác với lỗi kết nối hoặc exception ở transport.' },
      { prompt: 'Vì sao mini agent cần maxSteps?', choices: ['Để giới hạn vòng lặp và chi phí khi model tiếp tục gọi tool', 'Để tắt schema', 'Để giả lập nhiều client', 'Để bỏ qua cancellation'], answer: 0, why: 'Giới hạn bước ngăn agent lặp vô hạn và giúp kiểm soát thời gian, chi phí.' },
    ],
  },
  7: {
    recap: [
      'Streamable HTTP đưa MCP qua mạng; stateful và stateless có trade-off về phiên và khả năng scale.',
      'Guard Host/Origin và OAuth token validation bảo vệ remote server; scope giới hạn tool khả dụng.',
      'TLS, reverse proxy, process manager và cache hints cần phối hợp đúng khi deploy.',
    ],
    challenge: 'Vẽ và kiểm tra luồng client remote từ kết nối đầu tiên tới khi gọi tool được cấp scope; sau đó mô tả cách TLS/proxy chuyển request đến server.',
    acceptance: [
      'Request có Host/Origin không hợp lệ bị chặn.',
      'Token được kiểm chữ ký, issuer, audience, expiry và scope trước khi cấp tool.',
      'Client gọi được remote MCP qua HTTPS và deployment khởi động lại ổn định.',
    ],
    exitChecks: [
      'C50 Lab 36–43 xanh hết và sample check của module chạy được.',
      'Vẽ được luồng OAuth từ phản hồi 401 tới lần gọi tool thành công.',
    ],
    questions: [
      { prompt: 'Khi xác thực JWT cho MCP resource server, điều gì cần kiểm?', choices: ['Chỉ decode payload', 'Chữ ký, issuer, audience, expiry và quyền cần thiết', 'Chỉ tên người dùng', 'Chỉ có token hay không'], answer: 1, why: 'Decode không xác minh token; các claim và chữ ký cần được kiểm tra theo resource server.' },
      { prompt: 'Vì sao kiểm tra Host và Origin tuyệt đối quan trọng?', choices: ['Chặn DNS rebinding và request từ origin không được phép', 'Tăng tốc database', 'Thay thế OAuth', 'Nén JSON-RPC'], answer: 0, why: 'Kiểm tra đúng host/origin giảm nguy cơ trình duyệt bị lợi dụng để truy cập server nội bộ.' },
      { prompt: 'Token chỉ có scope nexus:read nên thấy gì?', choices: ['Tất cả tool ghi và xóa', 'Chỉ các tool được phép theo scope read', 'Không cần gọi tools/list', 'Token được nâng scope tự động'], answer: 1, why: 'Server phải áp dụng quyền tối thiểu và không quảng bá tool ngoài scope của token.' },
      { prompt: 'Mục đích chính của TLS ở remote MCP là gì?', choices: ['Mã hóa và xác thực kết nối mạng', 'Thay schema tool', 'Đảm bảo mọi tool an toàn', 'Lưu session trong trình duyệt'], answer: 0, why: 'TLS bảo vệ kênh truyền và giúp client xác thực endpoint server.' },
      { prompt: 'Khi reverse proxy làm chậm SSE/progress, cần kiểm tra gì?', choices: ['Buffering và chuyển tiếp header/stream trên route MCP', 'Tắt xác thực', 'Cho CORS *', 'Ghi SSE vào stdout'], answer: 0, why: 'Proxy buffering hoặc cấu hình stream không phù hợp có thể giữ event trước khi gửi tới client.' },
    ],
  },
}

export function McpModuleWrapup({ module, codeUrl }: { module: number; codeUrl?: string }) {
  const wrapup = wrapups[module]
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [missingAnswers, setMissingAnswers] = useState(false)

  if (!wrapup) return null

  const score = wrapup.questions.reduce((total, question, index) => total + Number(answers[index] === question.answer), 0)
  const passed = score >= 4

  const submitQuiz = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (wrapup.questions.some((_, index) => answers[index] === undefined)) {
      setMissingAnswers(true)
      return
    }
    setMissingAnswers(false)
    setSubmitted(true)
  }

  const resetQuiz = () => {
    setAnswers({})
    setSubmitted(false)
    setMissingAnswers(false)
  }

  return (
    <section className={styles.wrapup} aria-labelledby={`mcp-wrapup-${module}`}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Module {module} · ôn tập</p>
        <h3 id={`mcp-wrapup-${module}`}>Wrap-up: ôn lại và kiểm tra hiểu bài</h3>
        <p>Hãy thử thách trước khi mở code mẫu. Bài kiểm tra nhanh cần đạt 4/5; Exit Check đầy đủ vẫn nằm trong bài học.</p>
      </div>

      <div className={styles.recapGrid}>
        <section className={styles.panel}>
          <h4>Ý chính cần nhớ</h4>
          <ul>{wrapup.recap.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className={styles.panel}>
          <h4>Thử làm không xem lời giải</h4>
          <p>{wrapup.challenge}</p>
          <ul className={styles.criteria}>{wrapup.acceptance.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      </div>

      <details className={styles.quizDetails}>
        <summary>Kiểm tra hiểu bài · 5 câu hỏi</summary>
        <form className={styles.quiz} onSubmit={submitQuiz}>
          {wrapup.questions.map((question, questionIndex) => (
            <fieldset className={styles.question} key={question.prompt}>
              <legend><span>{questionIndex + 1}.</span> {question.prompt}</legend>
              {question.choices.map((choice, choiceIndex) => (
                <label className={styles.choice} key={choice}>
                  <input
                    type="radio"
                    name={`mcp-${module}-q${questionIndex}`}
                    checked={answers[questionIndex] === choiceIndex}
                    disabled={submitted}
                    onChange={() => setAnswers((previous) => ({ ...previous, [questionIndex]: choiceIndex }))}
                  />
                  <span>{choice}</span>
                </label>
              ))}
              {submitted && (
                <p className={answers[questionIndex] === question.answer ? styles.correct : styles.incorrect}>
                  {answers[questionIndex] === question.answer ? 'Đúng. ' : 'Chưa đúng. '}{question.why}
                </p>
              )}
            </fieldset>
          ))}
          {missingAnswers && <p className={styles.error} role="alert">Hãy trả lời đủ 5 câu trước khi chấm.</p>}
          {!submitted ? (
            <button className={styles.primaryButton} type="submit">Chấm bài</button>
          ) : (
            <div className={styles.result} role="status">
              <strong>{score}/5 · {passed ? 'Đạt bài kiểm tra nhanh' : 'Chưa đạt 4/5'}</strong>
              <span>{passed ? 'Tiếp tục với thử thách thực hành và Exit Check.' : 'Ôn lại phần giải thích, rồi thử lại.'}</span>
              <button className={styles.secondaryButton} type="button" onClick={resetQuiz}>Làm lại</button>
            </div>
          )}
        </form>
      </details>

      <div className={styles.exitPanel}>
        <div>
          <h4>Tự đánh giá theo roadmap</h4>
          <ul>{wrapup.exitChecks.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className={styles.actions}>
          {codeUrl && <a className={styles.secondaryButton} href={`${codeUrl}#${module === 1 ? 's15-code0' : 'ov-code'}`} target="_blank" rel="noreferrer">Mở code mẫu ↗</a>}
          {codeUrl && <a className={styles.primaryLink} href={`${codeUrl}#${module === 1 ? 's15-kiểm-tra-ac-exit-module-1' : 'fx-theory'}`} target="_blank" rel="noreferrer">Mở bài Exit Check ↗</a>}
        </div>
      </div>
    </section>
  )
}
