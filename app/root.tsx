import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
	useRouteError,
	type MetaFunction,
} from "@remix-run/react";

export const meta: MetaFunction = () => [
	{ name: "viewport", content: "width=device-width, initial-scale=1" },
];

export default () => {
	return (
		<html>
			<head>
				<Meta />
				<Links />
			</head>
			<body>
				<Outlet />
				<Scripts />
				<ScrollRestoration />
			</body>
		</html>
	);
};

export const ErrorBoundary = () => {
	const error = useRouteError();

	if (isRouteErrorResponse(error)) {
		return (
			<div>
				<h1>
					{error.status} {error.statusText}
				</h1>
				<div>{error.data}</div>
			</div>
		);
	}

	return <div>{String(error)}</div>;
};
