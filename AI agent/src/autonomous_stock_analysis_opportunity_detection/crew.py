import os

from crewai import LLM
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import (
	SerperDevTool,
	SerplyNewsSearchTool,
	ScrapeWebsiteTool,
	SerperScrapeWebsiteTool
)





@CrewBase
class AutonomousStockAnalysisOpportunityDetectionCrew:
    """AutonomousStockAnalysisOpportunityDetection crew"""

    
    @agent
    def financial_news_analyst(self) -> Agent:
        
        return Agent(
            config=self.agents_config["financial_news_analyst"],
            
            
            tools=[				SerperDevTool(),
				SerplyNewsSearchTool()],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                temperature=0.7,
            ),
            
        )
    
    @agent
    def technical_analysis_specialist(self) -> Agent:
        
        return Agent(
            config=self.agents_config["technical_analysis_specialist"],
            
            
            tools=[				ScrapeWebsiteTool(),
				SerperDevTool(),
				SerperScrapeWebsiteTool()],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                temperature=0.7,
            ),
            
        )
    
    @agent
    def fundamental_analysis_expert(self) -> Agent:
        
        return Agent(
            config=self.agents_config["fundamental_analysis_expert"],
            
            
            tools=[				ScrapeWebsiteTool(),
				SerperDevTool(),
				SerperScrapeWebsiteTool()],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                temperature=0.7,
            ),
            
        )
    
    @agent
    def investment_opportunity_strategist(self) -> Agent:
        
        return Agent(
            config=self.agents_config["investment_opportunity_strategist"],
            
            
            tools=[],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                temperature=0.7,
            ),
            
        )
    

    
    @task
    def monitor_financial_news(self) -> Task:
        return Task(
            config=self.tasks_config["monitor_financial_news"],
            markdown=False,
            
            
        )
    
    @task
    def perform_technical_analysis(self) -> Task:
        return Task(
            config=self.tasks_config["perform_technical_analysis"],
            markdown=False,
            
            
        )
    
    @task
    def conduct_fundamental_analysis(self) -> Task:
        return Task(
            config=self.tasks_config["conduct_fundamental_analysis"],
            markdown=False,
            
            
        )
    
    @task
    def generate_investment_opportunities(self) -> Task:
        return Task(
            config=self.tasks_config["generate_investment_opportunities"],
            markdown=False,
            
            
        )
    

    @crew
    def crew(self) -> Crew:
        """Creates the AutonomousStockAnalysisOpportunityDetection crew"""
        return Crew(
            agents=self.agents,  # Automatically created by the @agent decorator
            tasks=self.tasks,  # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
            chat_llm=LLM(model="openai/gpt-4o-mini"),
        )


