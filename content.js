console.log("Extensão Rodando");

const filter = {urls: ["https://dzenvolve.atlassian.net/rest/greenhopper/1.0/board/issues/transition"]};

chrome.webRequest.onBeforeRequest.addListener(
  async function(details) {
    let formData = decodeURIComponent(String.fromCharCode.apply(null,
      new Uint8Array(details.requestBody.raw[0].bytes)));
    formData = JSON.parse(formData);
    let issues = await getIssues(formData.issueKeys);
    
    if(formData.selectedTransitionId===21){
      let tokens = await getTokenJWT(issues);
      startClock(tokens);
    }else{
      let filteredIssues = issues.filter(function checkActualStatus(issue){
        return issue.fields.status.statusCategory.id === 4;
      });
      let tokens = await getTokenJWT(filteredIssues);
      stopClock(tokens);
    }
  },
  filter,
  ["requestBody"]
);

async function getIssues(issueKeys){
  let responses = [];
  for(key of issueKeys){
    let response = await fetch(`https://dzenvolve.atlassian.net/rest/api/3/issue/${key}`);
    let data = await response.json();
    responses.push(data);
  }  
  return responses;
}

async function getTokenJWT(issues){
  const url = 'https://dzenvolve.atlassian.net/plugins/servlet/ac/clockify-timesheets-time-tracking-reports/clk-stopwatch-4864619254695967724';
  
  let dataToSend;
  let response;
  let responses = [];

  for(issue of issues){
    dataToSend = new URLSearchParams({
      "plugin-key": "clockify-timesheets-time-tracking-reports",
      "product-context": '{"project.key":"'+issue.fields.project.key+'","project.id":"'+issue.fields.project.id+'","issue.id":"'+issue.id+'","issue.key":"'+issue.key+'","issuetype.id":"'+issue.fields.issuetype.id+'"}',
      "key": "clk-stopwatch-4864619254695967724",
      "width": "100%",
      "height": "100%",
      "classifier": "json"
    })
  
    const fetchOptions = {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      referrer: "https://dzenvolve.atlassian.net/jira/software/projects/DZ/boards/4?selectedIssue="+issue.key,
      headers: {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "pt-BR,pt;q=0.9",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
       body: dataToSend
    }

    response = await fetch(url, fetchOptions);  
    response = await response.json();
    responses.push(response);
  }
  return responses;
}

async function startClock (tokens){
  const url = "https://jira.integrations.clockify.me/api/stopwatch/start";
 
  for(token of tokens){
    let fetchOptions = {
      method: 'POST',
      headers: {
        'Authorization': 'JWT '+token.contextJwt
      }
    }

    response = await fetch(url, fetchOptions);  
    response = await response.json();
  }
}
async function stopClock (tokens){
  const url = "https://jira.integrations.clockify.me/api/stopwatch/stop";
 
  for(token of tokens){
    let fetchOptions = {
      method: 'POST',
      headers: {
        'Authorization': 'JWT '+token.contextJwt
      }
    }

    response = await fetch(url, fetchOptions);  
    response = await response.json();
  }
}



