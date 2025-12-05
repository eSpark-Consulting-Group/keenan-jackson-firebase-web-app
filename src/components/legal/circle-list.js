import { CheckCircle } from "lucide-react";

const CircleList = ({ data }) => {
  return (
    <section>
      {data.heading && (
        <h2
          className="text-xl font-semibold text-gray-900 mb-4"
          dangerouslySetInnerHTML={{ __html: data.heading }}
        />
      )}
      {data?.subHeading && (
        <p
          className="text-gray-700 mb-3"
          dangerouslySetInnerHTML={{ __html: data.subHeading }}
        />
      )}
      {data?.listItems && (
        <ul className="space-y-2 text-gray-700">
          {data.listItems.map((point, index) => (
            <li key={index} className="flex flex-col">
              <div className="flex items-start">
                {data.isCheckCircle ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <span>•&nbsp;&nbsp;</span>
                )}
                <span dangerouslySetInnerHTML={{ __html: point?.text }} />
              </div>

              {point?.points && (
                <ul className="space-y-2 text-gray-700 mt-2 ml-6">
                  {point.points.map((subPoint, subIndex) => (
                    <li key={subIndex} className="flex items-start">
                      {data.isCheckCircle ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <span>•&nbsp;&nbsp;</span>
                      )}
                      <span dangerouslySetInnerHTML={{ __html: subPoint }} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      {data.footer && (
        <p
          className="text-gray-700 mt-2"
          dangerouslySetInnerHTML={{ __html: data.footer }}
        />
      )}
    </section>
  );
};

export default CircleList;
