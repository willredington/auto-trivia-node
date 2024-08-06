import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { getServerAuthSession } from "~/server/auth";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import Link from "next/link";

export default async function Home() {
  const session = await getServerAuthSession();

  return (
    <div className="container flex justify-center">
      <Card className="w-2/3">
        <CardHeader>
          <CardTitle>Welcome to Auto Trivia</CardTitle>
          <CardDescription>
            Create and host your own trivia games on a wide range of topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            {session ? (
              <Link href="/game-room/create">Create New Game</Link>
            ) : (
              <Link href="/api/auth/signin">Sign in to create a game</Link>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
