import urllib3
from bs4 import BeautifulSoup 
import codecs

filename = "abbreviations.html"
html = ""
try:
    f=open(filename, mode="r", encoding="ISO-8859-1")
    html=f.read()
    f.close()
except IOError:
    print(filename + " not found or path is incorrect")
    http = urllib3.PoolManager()
    r = http.request('GET', 'http://digicoll.library.wisc.edu/cgi-bin/IcelOnline/IcelOnline.TEId-idx?type=HTML&rgn=DIV1&id=IcelOnline.IEOrd&target=IcelOnline.IEOrd.AbbrSym')
    html = r.data.decode("iso-8859-1") 
    f = open(filename, mode="w", encoding="ISO-8859-1")
    f.write(html)
    f.close()

soup = BeautifulSoup(html, 'html.parser')

table = soup.find(id="ICELONLINE.IEORD.ABBRSYM.T1")

print( "let abbreviations = [", end='')

first = True
rows = table.find_all("tr")
for row in rows:
    tds = row.find_all("td")
    i = tds[0].find_all("i")
    if len(i) == 1:
        abbr = i[0].string
        word_is = tds[2].string
        word_en = tds[1].string
        if not(first):
            print(",", end='')
        first = False
        print('\n  {{ "{}", "{}", "{}" }}'.format(abbr, word_is, word_en), end='')

print("\n]")
