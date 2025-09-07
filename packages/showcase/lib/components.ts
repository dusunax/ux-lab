export interface ComponentProp {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface ComponentExample {
  name: string;
  code: string;
}

export interface Component {
  id: string;
  name: string;
  description: string;
  category: string;
  props: ComponentProp[];
  examples: ComponentExample[];
}

export const components: Component[] = [
  {
    id: "button",
    name: "Button",
    description: "다양한 스타일과 상태를 지원하는 버튼 컴포넌트",
    category: "Form Controls",
    props: [
      {
        name: "variant",
        type: "primary | ghost | danger",
        default: "primary",
        description: "버튼 스타일",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "비활성화 상태",
      },
      { name: "children", type: "ReactNode", description: "버튼 내용" },
    ],
    examples: [
      { name: "Primary", code: "<Button>Primary Button</Button>" },
      { name: "Ghost", code: '<Button variant="ghost">Ghost Button</Button>' },
      {
        name: "Danger",
        code: '<Button variant="danger">Danger Button</Button>',
      },
      { name: "Disabled", code: "<Button disabled>Disabled Button</Button>" },
    ],
  },
  {
    id: "input",
    name: "Input",
    description: "폼 입력을 위한 텍스트 입력 필드 컴포넌트",
    category: "Form Controls",
    props: [
      {
        name: "placeholder",
        type: "string",
        description: "플레이스홀더 텍스트",
      },
      { name: "error", type: "string", description: "에러 메시지" },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "비활성화 상태",
      },
    ],
    examples: [
      { name: "Basic", code: '<Input placeholder="기본 입력 필드" />' },
      {
        name: "With Error",
        code: '<Input placeholder="에러 상태" error="이 필드는 필수입니다" />',
      },
      { name: "Disabled", code: '<Input placeholder="비활성화" disabled />' },
    ],
  },
  {
    id: "card",
    name: "Card",
    description: "콘텐츠를 그룹화하는 카드 컨테이너 컴포넌트",
    category: "Layout",
    props: [{ name: "children", type: "ReactNode", description: "카드 내용" }],
    examples: [
      {
        name: "Basic Card",
        code: "<Card><CardContent>카드 내용</CardContent></Card>",
      },
      {
        name: "With Header",
        code: "<Card><CardHeader><CardTitle>제목</CardTitle></CardHeader></Card>",
      },
    ],
  },
  {
    id: "modal",
    name: "Modal",
    description: "오버레이 다이얼로그 모달 컴포넌트",
    category: "Overlay",
    props: [
      { name: "isOpen", type: "boolean", description: "모달 열림 상태" },
      { name: "onClose", type: "() => void", description: "모달 닫기 핸들러" },
      { name: "title", type: "string", description: "모달 제목" },
    ],
    examples: [
      {
        name: "Basic Modal",
        code: '<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="제목">내용</Modal>',
      },
    ],
  },
  {
    id: "spinner",
    name: "Spinner",
    description: "로딩 상태를 표시하는 스피너 컴포넌트",
    category: "Feedback",
    props: [
      {
        name: "size",
        type: "sm | md | lg",
        default: "md",
        description: "스피너 크기",
      },
    ],
    examples: [
      { name: "Small", code: '<Spinner size="sm" />' },
      { name: "Medium", code: '<Spinner size="md" />' },
      { name: "Large", code: '<Spinner size="lg" />' },
    ],
  },
];

export const categories = ["Form Controls", "Layout", "Overlay", "Feedback"];
