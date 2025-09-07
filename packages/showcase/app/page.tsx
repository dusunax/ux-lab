"use client";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Modal,
  Spinner,
} from "@ux-lab/ui";
import { motion } from "framer-motion";
import { useState } from "react";
import { components, categories, type Component } from "../lib/components";

export default function Page() {
  const [selectedComponent, setSelectedComponent] = useState(components[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    categories // 모든 카테고리를 처음에 열어둠
  );

  // 카테고리별로 컴포넌트 그룹화
  const componentsByCategory = categories.reduce((acc, category) => {
    acc[category] = components.filter((comp) => comp.category === category);
    return acc;
  }, {} as Record<string, Component[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                UI Components
              </h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                v1.0.0
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                React 19 • Next.js 15 • Tailwind CSS
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Component Navigation */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Components
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const categoryComponents = componentsByCategory[category];
                    const isExpanded = expandedCategories.includes(category);

                    return (
                      <div
                        key={category}
                        className="border border-gray-200 rounded-lg shadow-sm"
                      >
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-t-lg transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <span>{category}</span>
                            <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                              {categoryComponents.length}
                            </span>
                          </div>
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Category Components */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-white">
                            {categoryComponents.map((component, index) => (
                              <button
                                key={component.id}
                                onClick={() => setSelectedComponent(component)}
                                className={`w-full text-left px-6 py-3 text-sm transition-colors border-l-4 ${
                                  selectedComponent.id === component.id
                                    ? "bg-blue-50 text-blue-700 font-medium border-blue-500"
                                    : "text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-300"
                                } ${
                                  index !== categoryComponents.length - 1
                                    ? "border-b border-gray-100"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      selectedComponent.id === component.id
                                        ? "bg-blue-500"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  <span>{component.name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={selectedComponent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Component Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {selectedComponent.name}
                  </h2>
                  <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                    {selectedComponent.category}
                  </span>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  {selectedComponent.description}
                </p>
              </div>

              {/* Live Examples */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Live Examples
                </h3>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="space-y-6">
                    {selectedComponent.id === "button" && (
                      <div className="flex flex-wrap gap-4">
                        <Button>Primary Button</Button>
                        <Button variant="ghost">Ghost Button</Button>
                        <Button variant="danger">Danger Button</Button>
                        <Button disabled>Disabled Button</Button>
                      </div>
                    )}

                    {selectedComponent.id === "input" && (
                      <div className="space-y-4 max-w-md">
                        <Input placeholder="기본 입력 필드" />
                        <Input
                          placeholder="에러 상태 입력 필드"
                          error="이 필드는 필수입니다"
                        />
                        <Input placeholder="비활성화된 입력 필드" disabled />
                      </div>
                    )}

                    {selectedComponent.id === "card" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardContent>
                            <p className="text-gray-600">
                              기본 카드 내용입니다.
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>카드 제목</CardTitle>
                            <CardDescription>카드 설명</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-600">
                              헤더가 있는 카드입니다.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {selectedComponent.id === "modal" && (
                      <div>
                        <Button onClick={() => setIsModalOpen(true)}>
                          모달 열기
                        </Button>
                        <Modal
                          isOpen={isModalOpen}
                          onClose={() => setIsModalOpen(false)}
                          title="샘플 모달"
                        >
                          <p className="text-gray-600 mb-4">
                            이것은 모달 다이얼로그의 예시입니다.
                          </p>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              onClick={() => setIsModalOpen(false)}
                            >
                              취소
                            </Button>
                            <Button onClick={() => setIsModalOpen(false)}>
                              확인
                            </Button>
                          </div>
                        </Modal>
                      </div>
                    )}

                    {selectedComponent.id === "spinner" && (
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <Spinner size="sm" />
                          <p className="text-sm text-gray-500 mt-2">Small</p>
                        </div>
                        <div className="text-center">
                          <Spinner size="md" />
                          <p className="text-sm text-gray-500 mt-2">Medium</p>
                        </div>
                        <div className="text-center">
                          <Spinner size="lg" />
                          <p className="text-sm text-gray-500 mt-2">Large</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Code Examples */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Code Examples
                </h3>
                <div className="space-y-4">
                  {selectedComponent.examples.map((example, index) => (
                    <div
                      key={index}
                      className="bg-gray-900 rounded-lg overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                        <span className="text-sm font-medium text-gray-300">
                          {example.name}
                        </span>
                        <button
                          onClick={() => copyToClipboard(example.code)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="p-4">
                        <pre className="text-sm text-gray-300 overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Props Documentation */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Props
                </h3>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Default
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedComponent.props.map((prop, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {prop.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {prop.type}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {prop.default || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {prop.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
