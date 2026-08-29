"use client";

import * as React from "react";
import QRCodeImpl from "react-qr-code";

export interface QRCodeProps extends React.SVGProps<SVGSVGElement> {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: "L" | "M" | "H" | "Q";
  title?: string;
  className?: string;
}

const QRCodeComponent = QRCodeImpl as unknown as React.ComponentType<QRCodeProps>;

export function QRCode(props: QRCodeProps) {
  return <QRCodeComponent {...props} />;
}

export default QRCode;
