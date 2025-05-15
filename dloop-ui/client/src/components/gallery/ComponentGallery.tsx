import React from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton, SkeletonCard, SkeletonTable } from '../ui/skeleton';
import { Tabs, TabsList, Tab, TabsContent } from '../ui/tabs';
import { ThemeToggle } from '../theme/theme-toggle';
import { Moon, Sun, Info, User, UserPlus, Calendar, Settings, Zap, ChevronRight, Heart } from 'lucide-react';

export default function ComponentGallery() {
  return (
    <div className="space-y-10 p-6">
      <h1 className="text-3xl font-bold">D-Loop UI Component Gallery</h1>
      <p className="text-muted-foreground">
        This page showcases the new enhanced UI components for the D-Loop application.
      </p>

      {/* Theme Toggle */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Theme Toggle</h2>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <ThemeToggle variant="mini" />
          <p className="text-sm text-muted-foreground">Try toggling the theme!</p>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>This is a basic card component</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Cards can contain any content and are useful for organizing information.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>

          <Card variant="outline">
            <CardHeader>
              <CardTitle>Outline Card</CardTitle>
              <CardDescription>Card with outline variant</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card uses the outline variant for a more subtle appearance.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">Action</Button>
            </CardFooter>
          </Card>

          <Card variant="gradient" hoverEffect={true}>
            <CardHeader>
              <CardTitle>Gradient Card</CardTitle>
              <CardDescription>Card with gradient and hover effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card uses a gradient background and has a hover animation effect.</p>
            </CardContent>
            <CardFooter>
              <Button variant="gradient" size="sm">Action</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="gradient">Gradient</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <Button animation="hover">Hover Effect</Button>
          <Button animation="active">Active Effect</Button>
          <Button animation="full" variant="gradient">Full Animation</Button>
          <Button animation="pulse" variant="outline">Pulse</Button>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <Badge size="sm">Small</Badge>
          <Badge>Default</Badge>
          <Badge size="lg">Large</Badge>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <Badge status="active" statusDot>Active</Badge>
          <Badge status="pending" statusDot>Pending</Badge>
          <Badge status="completed" statusDot>Completed</Badge>
          <Badge status="failed" statusDot>Failed</Badge>
          <Badge status="warning" statusDot>Warning</Badge>
        </div>
      </section>

      {/* Tabs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tabs</h2>
        <Tabs defaultValue="overview">
          <TabsList>
            <Tab value="overview">Overview</Tab>
            <Tab value="analytics">Analytics</Tab>
            <Tab value="reports">Reports</Tab>
            <Tab value="settings">Settings</Tab>
          </TabsList>
          <TabsContent value="overview">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>Summary of your account activity</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the overview tab content.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Your data visualization</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the analytics tab content.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reports">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>View generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the reports tab content.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage your preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the settings tab content.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Skeletons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Skeletons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Basic Skeletons</h3>
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton variant="circle" width={50} height={50} />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Skeleton Card</h3>
            <SkeletonCard />
          </div>
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium mb-2">Skeleton Table</h3>
            <SkeletonTable rows={3} columns={4} />
          </div>
        </div>
      </section>

      {/* Feature Tooltips - Coming Soon */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tooltips (Coming Soon)</h2>
        <div className="flex flex-wrap gap-6 items-center">
          <Button variant="outline" size="icon">
            <User className="h-5 w-5" />
          </Button>
          
          <Button variant="outline" size="icon">
            <UserPlus className="h-5 w-5" />
          </Button>
          
          <Button variant="outline" size="icon">
            <Calendar className="h-5 w-5" />
          </Button>
          
          <Button variant="outline" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          
          <Button className="gap-2">
            <Zap className="h-4 w-4" />
            <span>Power Boost</span>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">Tooltip integration is in progress and will be available soon.</p>
      </section>
    </div>
  );
}