fileIn = "./Data/hints/"

merged = []
for i in range(13)[1:]:
    with open(fileIn + str(i) + ".html", "r") as file:
        data = file.read()
        data = ''.join([s.strip() for s in data.split('\n')])
        merged.append(data)
    
import json

fileOut = "./Data/hints.json"
with open(fileOut, "w") as file:
    json.dump(merged, file)