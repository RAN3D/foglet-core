### Bash Command

```$ sh ladda.sh  file:///home/grall/foglet-core/example/experiments/experiment.html 5 ../firefox/firefox```

ladda.sh
```sh

#!/bin/bash

echo "\t #Parameters: $#"

for param in $@
do
        echo "\tParam: $param"
done

if [ $# -eq 3 ] ; then
        BROWSER_VERSION=$(${3} -v)
        for i in `seq 1 ${2}`
        do
                CLIENT_NAME="ladda-$i"
                pm2 start ladda-aux.sh -n $CLIENT_NAME -- ${3} ${1} $CLIENT_NAME
                echo "Client_$i: started on { ${1} } with { $BROWSER_VERSION }"
        done
else
        echo "\tUsage: sh ladda.sh <url> <clients_number> <browser_location>"
fi
```

ladda-aux.sh
```sh
${1} -CreateProfile ${3}
xvfb-run -a -s "-screen 0 1024x768x24" ${1} -P ${3} ${2}

```
