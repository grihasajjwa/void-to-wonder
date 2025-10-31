const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background transition-colors duration-300">
      <div className="text-center space-y-2">
        <div className="inline-block">
          <div className="h-1 w-16 bg-foreground/10 rounded-full mb-8 mx-auto" />
        </div>
        <h1 className="text-6xl font-light tracking-tight text-foreground">
          Blank Canvas
        </h1>
        <p className="text-lg text-muted-foreground font-light">
          Ready to create
        </p>
      </div>
    </div>
  );
};

export default Index;
