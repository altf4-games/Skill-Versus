import { SignIn } from '@clerk/clerk-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your SkillVersus account to start dueling
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <SignIn 
            appearance={{
              baseTheme: 'light',
              elements: {
                formButtonPrimary: 'bg-primary hover:bg-primary/90',
                card: 'shadow-none border-0',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden'
              }
            }}
            redirectUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </CardContent>
      </Card>
    </div>
  )
}
