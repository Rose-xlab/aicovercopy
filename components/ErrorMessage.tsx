interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="bg-destructive/10 text-destructive p-4 rounded-md">
      <p>{message}</p>
    </div>
  );
}