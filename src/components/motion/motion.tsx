"use client";

import { useEffect, useState, type ReactNode } from "react";

export function FadeIn({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
	return <div className={`cf-page-enter ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}

export function AnimatedWords({ words, className = "" }: { words: readonly string[]; className?: string }) {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (media.matches) return;
		const timer = window.setInterval(() => setIndex((value) => (value + 1) % words.length), 2400);
		return () => window.clearInterval(timer);
	}, [words.length]);

	return <span className={`cf-word-in inline-block ${className}`} key={words[index]}>{words[index]}</span>;
}

export function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
	const [display, setDisplay] = useState(value);

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (media.matches) return;
		let start = 0;
		const frame = (now: number) => {
			const progress = Math.min((now - start) / 420, 1);
			setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
			if (progress < 1) requestAnimationFrame(frame);
		};
		requestAnimationFrame(() => {
			start = performance.now();
			setDisplay(0);
			requestAnimationFrame(frame);
		});
	}, [value]);

	return <span className={className}>{display}</span>;
}
