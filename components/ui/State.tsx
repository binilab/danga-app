import type { ReactNode } from "react";
import { Card, CardBody } from "@/components/ui/Card";

type StateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

/**
 * 데이터가 비어 있을 때 사용자에게 다음 행동을 안내하는 공통 상태 컴포넌트입니다.
 */
export function EmptyState({ title, description, action }: StateProps) {
  return (
    <Card>
      <CardBody className="py-8 text-center">
        <p className="text-base font-semibold text-slate-800">{title}</p>
        {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </CardBody>
    </Card>
  );
}

/**
 * 오류 상황에서 같은 톤으로 메시지를 보여주는 공통 상태 컴포넌트입니다.
 */
export function ErrorState({ title, description, action }: StateProps) {
  return (
    <Card>
      <CardBody className="py-8 text-center">
        <p className="text-base font-semibold text-rose-700">{title}</p>
        {description ? <p className="mt-2 text-sm text-rose-600">{description}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </CardBody>
    </Card>
  );
}
