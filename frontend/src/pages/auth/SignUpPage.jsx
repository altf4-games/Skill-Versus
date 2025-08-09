import { SignUp } from '@clerk/clerk-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join the Arena</CardTitle>
          <CardDescription>
            Create your SkillVersus account and start challenging others
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <SignUp 
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
            signInUrl="/sign-in"
          />
        </CardContent>
      </Card>
    </div>
  )
}
