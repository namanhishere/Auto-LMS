from selenium import webdriver
from time import sleep
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime
import pytz
import os
import json
import requests

timeZone = pytz.timezone('Asia/Ho_Chi_Minh') 

def checkCacheExit():
    return os.path.exists('./cache.txt')

def refreshCookie():
    driver = webdriver.Chrome(ChromeDriverManager().install())
    driver.get("https://thptnguyenhuuhuanthuduc.lms.vnedu.vn/security/ssoHCM/?isHocSinh=1")
    userElement = driver.find_element_by_id("UserName")
    userElement.send_keys(os.getenv('USERNAME'))

    passElement = driver.find_element_by_id("Password")
    passElement.send_keys(os.getenv('PASSWORD'))
    passElement.submit()

    cookie = driver.get_cookies()
    driver.close()
    return cookie

def checkCookieAlive(cookie):
    for x in cookie:
        if(x["name"] == "app_token"):
            if x["expiry"] < datetime.now(timeZone).timestamp():
                return False
            else:
                return True

def getCookieFromDiskCahe():
    if not(checkCacheFileExit()): open("cache.txt","x")
    file = open("cache.txt","r")
    returnValue = json.loads(file.read() or "{}")
    file.close()

    return returnValue

def writeCookieToDiskCahe(value):
    if not(checkCacheFileExit()): open("cache.txt","w").write('{}')
    
    return open("cache.txt","w").write(json.dumps(value))

def checkCacheFileExit():
    return os.path.exists('./cache.txt')

# def RoolCall(cooki,tiet):
   
def getAppTOKEN(cooki):
    for x in cooki:
        if(x["name"] == "app_token"):
            return {"app_token":x["value"]}


def getClassInfo(cooki):
    resq = requests.get("https://thptnguyenhuuhuanthuduc.lms.vnedu.vn/module/virtualClassroom/service/booking/getBookingCalendarForUser", cookies= getAppTOKEN(cooki))
    dataBack = json.loads(resq.text)
    return dataBack["data"]

cookie = getCookieFromDiskCahe()
if (cookie == {}) or (not(checkCookieAlive(cookie))):
    cookie = refreshCookie()
    writeCookieToDiskCahe(cookie)
# print(cookie)
# print(getAppTOKEN(cookie))
print(getClassInfo(cookie))


print(os.getenv("PASSWORD"))