"use client"
import{ useEffect, useState} from "react"
import { Sidebar } from '@/components/ui/sidebar';

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
        { name: "Tokens", icon: Zap },
        { name: "AI Website", icon: Cpu },
        { name: "Decentralized CDN", icon: Network },
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
      async function init() {
          if(authenticated && user?.email?.address) {
            try{
              console.log(user);

            await initializeClients(user.email.address);
            setIsInitialized(true); 
          } catch (error) {
          console.error("Failed to initialize clients:", error);
          setDeploymentError("");
        } 
      }
      }
      init()
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

    // handle deployment
    console.log(userId);
    const handleDeploy = async () => {
      setIsDeploying(true);
      setDeploymentError("");

      try {
        //
        if(!isInitialized){
          throw new Error("Clients not initialized");
        }
        if (userId === null){
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
  
    const handleAIWebsiteDeploy = async (domain: string, content: string) => {
      setAiDeploymentStatus({
        isDeploying: true,
        deployedUrl: "",
        ipfsUrl: "",
        error: "",
      });
      setDeploymentError("");
      console.log(userId);
  
      try {
        if (!isInitialized || userId === null) {
          throw new Error("Cannot deploy: missing initialization or user ID");
        }
  
        const { webpage, txHash, cid, deploymentUrl, name, w3nameUrl } =
          await createWebpageWithName(userId, domain, content);
  
        const ipfsUrl = `https://dweb.link/ipfs/${cid}`;
        const finalDeployedUrl = w3nameUrl || deploymentUrl;
  
        setAiDeploymentStatus({
          isDeploying: false,
          deployedUrl: finalDeployedUrl,
          ipfsUrl: ipfsUrl,
          error: "",
        });
  
        setDeployedUrl(finalDeployedUrl);
        setW3name(name);
        console.log(
          `Deployed AI-generated website successfully. Transaction hash: ${txHash}, CID: ${cid}, URL: ${finalDeployedUrl}, W3name: ${name}`
        );
  
        // Refresh the user's webpages
        const updatedWebpages = await getUserWebpages(userId);
        setUserWebpages(updatedWebpages as Webpage[]);
      } catch (error: any) {
        console.error("AI website deployment failed:", error);
        setAiDeploymentStatus({
          isDeploying: false,
          deployedUrl: "",
          ipfsUrl: "",
          error: `AI website deployment failed: ${error.message}`,
        });
        setDeploymentError(`AI website deployment failed: ${error.message}`);
      }
    };
  
    return(
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
                <Card className="bg-[#0a0a0a] border-[#18181b]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Websites
                </CardTitle>
                <Globe className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  0
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0a0a] border-[#18181b]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Latest Deployment
                </CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  N/A
                  {/* {userWebpages.length > 0
                    ? new Date(
                        Math.max(
                          ...userWebpages
                            .filter((w) => w.deployments?.deployedAt)
                            .map((w) => w.deployments!.deployedAt!.getTime())
                        )
                      ).toLocaleDateString()
                    : "N/A"} */}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0a0a] border-[#18181b]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Deployments
                </CardTitle>
                <Activity className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {/* {userWebpages.filter((w) => w.deployments).length} */}
                </div>
              </CardContent>
            </Card>
            </div>
            {activeTab === "Sites" && <p>Sites</p>}
            {activeTab === "Deploy" && (
              <>
               <Card className="bg-[#0a0a0a] border-[#18181b]">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">
                    {selectedWebpage ? "Edit Website" : "Deploy a New Website"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="domain" className="text-lg text-gray-400">
                        Domain
                      </Label>
                      <Input
                        id="domain"
                        placeholder="Enter your domain"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="mt-1 bg-[#0a0a0a] text-white border-gray-700"
                        disabled={!!selectedWebpage}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="content"
                        className="text-lg text-gray-400"
                      >
                        Content
                      </Label>
                      <Textarea
                        id="content"
                        placeholder="Enter your HTML content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="mt-1 min-h-[200px] font-mono text-sm bg-[#0a0a0a] text-white border-gray-700"
                      />
                    </div>
                    <Button
                      onClick={selectedWebpage ? handleUpdate : handleDeploy}
                      // onClick={handleDeploy}
                      disabled={
                        isDeploying ||
                        !domain ||
                        !content ||
                        !isInitialized ||
                        userId === null
                      }
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {selectedWebpage ? "Update Website" : "Deploy to HTTP3"}
                      {isDeploying ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {selectedWebpage ? "Updating..." : "Deploying..."}
                        </>
                      ) : selectedWebpage ? (
                        "Update Website"
                      ) : (
                        "Deploy to HTTP3"
                      )}
                    </Button>
                    {deploymentError && (
                      <p className="text-red-400 mt-2">{deploymentError}</p>
                    )}
                    {deployedUrl && (
                      <DeploymentVisual deployedUrl={deployedUrl} />
                    )}
                  </div>
                </CardContent>
              </Card>

              {content && (
                <Card className="mt-4 bg-[#0a0a0a] border-[#18181b]">
                  <CardHeader>
                    <CardTitle className="text-white">Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border bg-white p-4 rounded-lg">
                      <iframe
                        srcDoc={content}
                        style={{
                          width: "100%",
                          height: "400px",
                          border: "none",
                        }}
                        title="Website Preview"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              </>
            )}
            </div>
        </div>
        </div>
    )
}
