"use client"
import{ useEffect, useState} from "react"
import { Sidebar } from '@/components/ui/sidebar';
import { ExampleWebsites } from "@/components/ExampleWebsite";

type Webpage = {
  webpages: {
    id: number;
    domain: string;
    cid: string;
    name: string | null;
  };
  deployments: {
    id: number;
    deploymentUrl: string;
    deployedAt: Date | null;
    transactionHash: string;
  } | null;
};

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
  } from "@/components/ui/card"; 
import {Layout, Rocket, GitBranch, Zap, Cpu, Network, Search, Globe, Shield, Clock, Activity, Loader2} from 'lucide-react'
import { Label } from "@radix-ui/react-dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createWebpageWithName, getUserIdByEmail, getUserWebpages, getWebpageContent, initializeClients, updateWebpageContent } from "@/utils/db/actions";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import DeploymentVisual from "@/components/DeploymentVisual";

export default function Dashboard() {
    const sidebarItems = [
        { name: "Sites", icon: Layout },
        { name: "Deploy", icon: Rocket },
        { name: "Manage Websites", icon: GitBranch },
        { name: "Search Engine", icon: Search },
        { name: "Example Websites", icon: Globe },
        { name: "Smart Contracts", icon: Shield },
      ] as any;

      const [code, setCode] = useState(``);
      const [githubUrl, setGithubUrl] = useState("");
      const [deployedUrl, setDeployedUrl] = useState("");
      const [isDeploying, setIsDeploying] = useState(false);
      const [livePreview, setLivePreview] = useState(code);
      const [activeTab, setActiveTab] = useState("Sites");
      const [domain, setDomain] = useState("");
      const [content, setContent] = useState("");
      const [deploymentError, setDeploymentError] = useState("");
      const { user, authenticated } = usePrivy();
      const [isInitialized, setIsInitialized] = useState(false);
      const [userId, setUserId] = useState<number | null>(null);
      const [w3name, setW3name] = useState<string | null>(null);
      const [userWebpages, setUserWebpages] = useState<Webpage[]>([]);
      const [selectedWebpage, setSelectedWebpage] = useState<Webpage | null>(null);
      const router = useRouter();

     
      useEffect(() => {
        console.log(user?.email?.address, "new")
        async function init() {
          if (authenticated && user?.email?.address) {
            try {
              console.log(user);
              await initializeClients(user.email.address);
              setIsInitialized(true);
            } catch (error) {
              console.error("Failed to initialize clients:", error);
              setDeploymentError("Failed to initialize deployment. Please try again.");
            }
          }
          else{
            console.log("break")
          }
        }
      
        init();
      }, [authenticated, user]);
    
      useEffect(() => {
        async function fetchUserId() {
          if (authenticated && user?.email?.address) {
            const fetchedUserId = await getUserIdByEmail(user?.email?.address);
            console.log(fetchUserId);
            console.log(user.email.address);
            setUserId(fetchedUserId);
          }
        }
    
        fetchUserId();
      }, [authenticated, user]);
    
      console.log(userId);
      console.log(isInitialized)
      const handleDeploy = async () => {
        setIsDeploying(true);
        setDeploymentError("");
        try {
          if (!isInitialized) {
            throw new Error("Clients not initialized");
          }
          if (userId === null) {
            throw new Error("User not authenticated or ID not found");
          }
    
          const { webpage, txHash, cid, deploymentUrl, name, w3nameUrl } =
            await createWebpageWithName(userId, domain, content);
    
          setDeployedUrl(w3nameUrl || deploymentUrl);
          setW3name(name);
          console.log(
            `Deployed successfully. Transaction hash: ${txHash}, CID: ${cid}, URL: ${
              w3nameUrl || deploymentUrl
            }, W3name: ${name}`
          );

      // Refresh the user's webpages
      const updatedWebpages = await getUserWebpages(userId);
      setUserWebpages(updatedWebpages as Webpage[]);
      }
      catch(error){
      console.error("Deployment failed:", error);
      setDeploymentError("Deployment failed. Please try again.");
      } finally{
        setIsDeploying(false);
      }

    };

    const handleUpdate = async () => {
      setIsDeploying(true);
      setDeploymentError("");
      try {
        if (!isInitialized || userId === null || !selectedWebpage) {
          throw new Error(
            "Cannot update: missing initialization, user ID, or selected webpage"
          );
        }
  
        const { txHash, cid, deploymentUrl, w3nameUrl } =
          await updateWebpageContent(
            userId,
            selectedWebpage.webpages.id,
            content
          );
  
        setDeployedUrl(w3nameUrl || deploymentUrl);
        console.log(
          `Updated successfully. Transaction hash: ${txHash}, CID: ${cid}, URL: ${
            w3nameUrl || deploymentUrl
          }`
        );
        setLivePreview(content);
  
        // Update the selected webpage in the state
        setSelectedWebpage((prev) => {
          if (!prev) return null;
          return {
            webpages: {
              ...prev.webpages,
              cid,
            },
            deployments: {
              id: prev.deployments?.id ?? 0,
              deploymentUrl,
              transactionHash: txHash,
              deployedAt: new Date(),
            },
          };
        });
  
        // Refresh the user's webpages
        const updatedWebpages = await getUserWebpages(userId);
        setUserWebpages(updatedWebpages as Webpage[]);
      } catch (error: any) {
        console.error("Update failed:", error);
        setDeploymentError(`Update failed: ${error.message}`);
      } finally {
        setIsDeploying(false);
      }
    };
  
    useEffect(() => {
      async function fetchUserWebpages() {
        if (userId) {
          const webpages = await getUserWebpages(userId);
          console.log("=======web pages", webpages);
          setUserWebpages(webpages as Webpage[]);
        }
      }
      fetchUserWebpages();
    }, [userId]);
  
    const handleEdit = async (webpage: Webpage) => {
      setSelectedWebpage(webpage);
      setDomain(webpage.webpages.domain);
      const webpageContent = await getWebpageContent(webpage.webpages.id);
      setContent(webpageContent);
      setW3name(webpage.webpages.name);
      setActiveTab("Deploy");
    };
  
    const handleUrlClick = (url: string) => {
      window.open(url, "_blank", "noopener,noreferrer");
    };

    const truncateUrl = (url: string, maxLength: number = 30) => {
      if (!url) return "";
      if (url.length <= maxLength) return url;
      const start = url.substring(0, maxLength / 2 - 2);
      const end = url.substring(url.length - maxLength / 2 + 2);
      return `${start}...${end}`;
    };

    
  
    return (
      <div className="min-h-screen bg-black text-grey-300">
        <div className="flex">
          <Sidebar
            items={sidebarItems}
            activeItem={activeTab}
            setActiveItem={setActiveTab}
          />
    
          <div className="flex-1 p-10 ml-64">
            <h1 className="text-4xl font-bold mb-8 text-white">
              Welcome to your dashboard
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Total Websites Card */}
              <Card className="bg-[#0a0a0a] border-[#18181b]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Total Websites
                  </CardTitle>
                  <Globe className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {userWebpages.length}
                  </div>
                </CardContent>
              </Card>
    
              {/* Latest Deployment Card */}
              <Card className="bg-[#0a0a0a] border-[#18181b]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Latest Deployment
                  </CardTitle>
                  <Clock className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {userWebpages.length > 0
                      ? new Date(
                          Math.max(
                            ...userWebpages
                              .filter((w) => w.deployments?.deployedAt)
                              .map((w) => w.deployments!.deployedAt!.getTime())
                          )
                        ).toLocaleDateString()
                      : "N/A"}
                  </div>
                </CardContent>
              </Card>
    
              {/* Total Deployments Card */}
              <Card className="bg-[#0a0a0a] border-[#18181b]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Total Deployments
                  </CardTitle>
                  <Activity className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {userWebpages.filter((w) => w.deployments).length}
                  </div>
                </CardContent>
              </Card>
            </div>
    
            {/* Conditional Rendering for Active Tab */}
            {/* {activeTab === "Sites" && (
              <>
                {/* Traffic Overview */}
                <Card className="bg-[#0a0a0a] border-[#18181b] mb-8">
                  <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                    <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                      <CardTitle className="text-2xl text-white">
                        Website Traffic Overview
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Visitor trends across desktop and mobile platforms over the past quarter
                      </CardDescription>
                    </div>
                    <div className="flex">
                      {["desktop", "mobile"].map((key) => {
                        const chart = key as keyof typeof chartConfig;
                        return (
                          <button
                            key={chart}
                            data-active={activeChart === chart}
                            className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/20 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                            onClick={() => setActiveChart(chart)}
                          >
                            <span className="text-sm text-white">
                              {chartConfig[chart].label}
                            </span>
                            <span className="text-5xl font-bold text-white">
                              {total[chart].toLocaleString()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </CardHeader>
                  <CardContent className="px-2 sm:p-6">
                    <ChartContainer
                      config={chartConfig}
                      className="aspect-auto h-[250px] w-full bg-[#0a0a0a]"
                    >
                      <BarChart
                        data={chartData}
                        margin={{ left: 0, right: 0, top: 0, bottom: 20 }}
                      >
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={32}
                          tick={{ fill: "#666" }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            });
                          }}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              className="bg-[#1a1a1a] text-white border-none rounded-md shadow-lg"
                              nameKey={activeChart}
                              labelFormatter={(value) => {
                                return new Date(value).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                );
                              }}
                            />
                          }
                        />
                        <Bar
                          dataKey={activeChart}
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                    {userWebpages.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        It may take up to 24 hours to update the count.
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Please note: It may take up to 48 hours to load and display all data.
                    </p>
                  </CardContent>
                </Card>
              </>
            )} */}
    
            {activeTab === "Deploy" && (
              <Card className="bg-[#0a0a0a] border-[#18181b]">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">
                    {selectedWebpage ? "Edit Website" : "Deploy a New Website"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Deployment Form Content */}
                </CardContent>
              </Card>
            )}

           {activeTab === "Example Websites" && <ExampleWebsites />}
          </div>
        </div>
      </div>

 
    );
  }